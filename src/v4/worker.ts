import { loadMap } from './map';
import { advanceGame, commandGame, createGame, snapshotGame } from './game';
import type { GameCommand, V4Map } from './types';
import type { Reply, Request } from './protocol';
/** The Worker is the sole owner of model, clock and resources. */
export class WorkerSession {
  private game;private last:number|null=null;
  constructor(map:V4Map,private test:boolean){this.game=createGame(map);}
  snapshot(){return snapshotGame(this.game);}
  command(command:GameCommand,now:number){this.tick(now);const result=commandGame(this.game,command);if(result.ok)this.last=now;return result;}
  hidden(){if(this.game.phase==='running')commandGame(this.game,{type:'pause'});this.last=null;}
  tick(now:number){
    if(this.test)return;
    if(this.last===null){this.last=now;return;}
    const elapsed=(now-this.last)/1000;this.last=now;
    if(this.game.phase!=='running')return;
    if(elapsed>.75||elapsed<0){this.hidden();return;}
    advanceGame(this.game,elapsed);
  }
  advanceForTest(seconds:number){
    if(!this.test)return {ok:false,reason:'Testmodus ist nicht aktiv.'};
    if(!Number.isFinite(seconds)||seconds<0||seconds>90)return {ok:false,reason:'Ungültiger Testschritt.'};
    advanceGame(this.game,seconds);return {ok:true};
  }
}
// Vitest imports WorkerSession without constructing a browser Worker.
if(typeof document==='undefined'&&typeof self!=='undefined'&&typeof self.postMessage==='function'){
  let session:WorkerSession|null=null,initializing=false;
  const send=(reply:Reply)=>{
    if(reply.type==='snapshot'||reply.type==='ready')self.postMessage(reply,{transfer:[reply.snapshot.depths.buffer,reply.snapshot.flowX.buffer,reply.snapshot.flowY.buffer]});
    else self.postMessage(reply);
  };
  self.onmessage=async(event:MessageEvent<Request>)=>{
    const message=event.data;
    try{
      if(message.type==='init'){
        if(session||initializing)throw new Error('Worker bereits initialisiert.');initializing=true;
        const map=await loadMap();session=new WorkerSession(map,message.test);send({id:message.id,type:'ready',map,snapshot:session.snapshot()});
        let count=0;setInterval(()=>{if(!session)return;session.tick(performance.now());if(++count%3===0)send({id:0,type:'snapshot',snapshot:session.snapshot(),ok:true});},40);
        return;
      }
      if(!session)throw new Error('Karte wird noch geladen.');
      let result:{ok:boolean;reason?:string}={ok:true};
      if(message.type==='command')result=session.command(message.command,performance.now());
      if(message.type==='hidden')session.hidden();
      if(message.type==='advance')result=session.advanceForTest(message.seconds);
      send({id:message.id,type:'snapshot',snapshot:session.snapshot(),...result});
    }catch(error){send({id:message.id,type:'error',reason:error instanceof Error?error.message:String(error)});}
  };
}
