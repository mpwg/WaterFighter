/** Animation time follows the worker's run state and selected speed. */
export class FlowClock {
  private time=0;
  private last?:number;
  private rate=0;
  tick(now:number):number {
    if(this.last!==undefined)this.time+=Math.max(0,now-this.last)*this.rate;
    this.last=now;
    return this.time;
  }
  setRate(rate:0|1|2,now:number):void {this.tick(now);this.rate=rate;}
  reset(now:number):void {this.time=0;this.last=now;this.rate=0;}
}
