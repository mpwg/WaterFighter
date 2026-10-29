import { readdirSync,readFileSync } from 'node:fs';
/** Aggregate Linux VmRSS for this test runner and its process descendants.
 * Shared pages may be counted more than once; GPU allocations are not complete. */
export function processTreeRss(rootPid=process.pid) {
  try {
    const processes=new Map();
    for(const name of readdirSync('/proc')) {
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
