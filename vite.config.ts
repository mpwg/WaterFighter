import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/** A static, self-contained compressed scenario, also served by Vite in development. */
export function compressedScenario(file=fileURLToPath(new URL('./public/scenarios/brigittenau-v1.json',import.meta.url))):Plugin {
  const route='/scenarios/brigittenau-v1.json.bin';
  const content=()=>gzipSync(readFileSync(file),{level:9});
  return {
    name:'compressed-scenario',
    configureServer(server) {
      let cache:Buffer|undefined,cacheKey='';
      server.middlewares.use((req,res,next)=>{
        if(req.url?.split('?')[0]!==route)return next();
        try {
          const stat=statSync(file,{bigint:true}),key=`${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;
          if(!cache || cacheKey!==key){cache=content();cacheKey=key;}
          res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Length',cache.length);res.end(cache);
        } catch {
          res.statusCode=503;res.end('Szenariodatei nicht verfügbar');
        }
      });
    },
    generateBundle() {this.emitFile({type:'asset',fileName:route.slice(1),source:content()});},
  };
}
export default defineConfig({base:'./',build:{target:'esnext'},plugins:[compressedScenario()]});
