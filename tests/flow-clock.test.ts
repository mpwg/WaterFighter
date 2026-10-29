import {expect,it} from 'vitest';
import {FlowClock} from '../src/render/flow-clock';

it('hält die Animation in Vorbereitung, Pause und nach Neustart an',()=>{
  const clock=new FlowClock();
  expect(clock.tick(10)).toBe(0);
  expect(clock.tick(20)).toBe(0);
  clock.setRate(1,20);expect(clock.tick(22)).toBe(2);
  clock.setRate(0,23);expect(clock.tick(50)).toBe(3);
  clock.setRate(2,50);expect(clock.tick(52)).toBe(7);
  clock.setRate(0,52);expect(clock.tick(60)).toBe(7);
  clock.reset(60);expect(clock.tick(70)).toBe(0);
});
