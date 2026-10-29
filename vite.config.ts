import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/** A static, self-contained compressed scenario, also served by Vite in development. */
function compressedScenario():Plugin {
  const file=fileURLToPath(new URL('./public/scenarios/brigittenau-v1.json',import.meta.url));
  const route='/scenarios/brigittenau-v1.json.bin';
  const content=()=>gzipSync(readFileSync(file),{level:9});
  return {
    name:'compressed-scenario',
    configureServer(server) {
      let cache=content();
      server.watcher.add(file);
      server.watcher.on('change',path=>{if(path===file)cache=content();});
      server.middlewares.use((req,res,next)=>{
        if(req.url?.split('?')[0]!==route)return next();
        res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Length',cache.length);res.end(cache);
      });
    },
    generateBundle() {this.emitFile({type:'asset',fileName:route.slice(1),source:content()});},
  };
}
export default defineConfig({base:'./',plugins:[compressedScenario()]});
