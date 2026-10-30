import { readdirSync,readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
/** Aggregate resident memory for this test runner and its process descendants.
 * Shared pages may be counted more than once; GPU allocations are not complete. */
export function processTreeRss(rootPid=process.pid) {
  try {
    const processes=new Map();
    if(process.platform==='darwin') {
      // macOS ps reports RSS in KiB. This is not proportional or private memory.
      const rows=execFileSync('/bin/ps',['-axo','pid=,ppid=,rss='],{encoding:'utf8'});
      for(const row of rows.split('\n')) {
        const match=row.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s*$/);
        if(match)processes.set(Number(match[1]),{parent:Number(match[2]),rss:Number(match[3])*1024});
      }
    } else for(const name of readdirSync('/proc')) {
      if(!/^\d+$/.test(name))continue;
      try {
        const stat=readFileSync(`/proc/${name}/stat`,'utf8'),fields=stat.slice(stat.lastIndexOf(')')+2).split(' ');
        const status=readFileSync(`/proc/${name}/status`,'utf8'),match=status.match(/^VmRSS:\s+(\d+)\s+kB/m);
        processes.set(Number(name),{parent:Number(fields[1]),rss:match?Number(match[1])*1024:0});
      } catch { /* A short-lived process may disappear during the read. */ }
    }
    if(!processes.has(rootPid))return null;
    const included=new Set([rootPid]);let changed=true;
    while(changed){changed=false;for(const [pid,p] of processes)if(!included.has(pid)&&included.has(p.parent)){included.add(pid);changed=true;}}
    let bytes=0;for(const pid of included)bytes+=processes.get(pid)?.rss??0;
    return {bytes,processes:included.size};
  } catch {return null;}
}

/** Group process-tree RSS, proportional set size and private resident pages by Chromium role. */
export function processTreeMemoryByRole(rootPid=process.pid) {
  try {
    const processes=new Map();
    for(const name of readdirSync('/proc')) {
      if(!/^\d+$/.test(name))continue;
      try {
        const stat=readFileSync(`/proc/${name}/stat`,'utf8'),fields=stat.slice(stat.lastIndexOf(')')+2).split(' ');
        const status=readFileSync(`/proc/${name}/status`,'utf8'),rss=status.match(/^VmRSS:\s+(\d+)\s+kB/m);
        const command=readFileSync(`/proc/${name}/cmdline`,'utf8');
        const type=command.match(/(?:^|[\s\0])--type=([^\s\0]+)/)?.[1];
        const role=type || (command.split(/[\s\0]/)[0]?.includes('chrome')?'browser':'other');
        let pss=null,privateRss=null;
        try {
          const rollup=readFileSync(`/proc/${name}/smaps_rollup`,'utf8');
          const value=rollup.match(/^Pss:\s+(\d+)\s+kB/m),clean=rollup.match(/^Private_Clean:\s+(\d+)\s+kB/m),dirty=rollup.match(/^Private_Dirty:\s+(\d+)\s+kB/m);
          if(value)pss=Number(value[1])*1024;
          if(clean&&dirty)privateRss=(Number(clean[1])+Number(dirty[1]))*1024;
        } catch { /* Not all systems expose smaps_rollup. */ }
        processes.set(Number(name),{parent:Number(fields[1]),rss:rss?Number(rss[1])*1024:0,pss,privateRss,role});
      } catch { /* Process may exit while being inspected. */ }
    }
    if(!processes.has(rootPid))return null;
    const included=new Set([rootPid]);let changed=true;
    while(changed){changed=false;for(const [pid,p] of processes)if(!included.has(pid)&&included.has(p.parent)){included.add(pid);changed=true;}}
    const roles={};
    for(const pid of included) {
      const p=processes.get(pid);if(!p)continue;
      const group=roles[p.role]??={processes:0,rss:0,pss:0,missingPss:0,privateRss:0,missingPrivateRss:0};
      group.processes++;group.rss+=p.rss;
      if(p.pss===null)group.missingPss++;else group.pss+=p.pss;
      if(p.privateRss===null)group.missingPrivateRss++;else group.privateRss+=p.privateRss;
    }
    return roles;
  } catch {return null;}
}
