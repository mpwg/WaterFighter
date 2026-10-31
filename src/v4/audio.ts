export class GameAudio {
  muted=false;private context:AudioContext|null=null;
  unlock(){try{this.context??=new AudioContext();void this.context.resume();}catch{/* Audio is optional. */}}
  play(kind:'barrier'|'blast'|'remove'){
    if(this.muted||!this.context||this.context.state!=='running')return;
    const ctx=this.context,t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=kind==='blast'?'sawtooth':'sine';osc.frequency.setValueAtTime(kind==='blast'?95:kind==='barrier'?500:310,t);osc.frequency.exponentialRampToValueAtTime(35,t+.16);
    gain.gain.setValueAtTime(kind==='blast'?.09:.045,t);gain.gain.exponentialRampToValueAtTime(.001,t+.2);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.21);
  }
}
