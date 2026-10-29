import {mkdtempSync,writeFileSync,renameSync,unlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createServer} from 'vite';
import {expect,it} from 'vitest';
import {compressedScenario} from '../vite.config';

it('liefert im Entwicklungsserver direkte und atomare Szenarioänderungen ohne alte Daten',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'waterfighter-vite-')),file=join(dir,'scenario.json'),replacement=join(dir,'replacement.json');
 writeFileSync(file,'{"value":1}');
 const server=await createServer({configFile:false,root:dir,plugins:[compressedScenario(file)],server:{host:'127.0.0.1',port:0}});
 try {
  await server.listen();const address=server.httpServer!.address();if(!address || typeof address==='string')throw Error('Serveradresse fehlt');
  const url=`http://127.0.0.1:${address.port}/scenarios/brigittenau-v1.json.bin`;
  async function fetchBody(){const response=await fetch(url);expect(response.status).toBe(200);return gunzipSync(Buffer.from(await response.arrayBuffer())).toString();}
  expect(await fetchBody()).toBe('{"value":1}');
  writeFileSync(file,'{"value":2}');expect(await fetchBody()).toBe('{"value":2}');
  writeFileSync(replacement,'{"value":3}');renameSync(replacement,file);expect(await fetchBody()).toBe('{"value":3}');
  unlinkSync(file);expect((await fetch(url)).status).toBe(503);
 } finally {await server.close();rmSync(dir,{recursive:true,force:true});}
});
