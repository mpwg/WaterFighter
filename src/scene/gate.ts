import type { Gate } from "../flood/types";

export interface GatePose {
  centerY: number;
  height: number;
  bottom: number;
  top: number;
}

export function gatePose(gate: Gate, base: number, open: boolean): GatePose {
  const height = gate.sill - base,
    bottom = open ? gate.sill : base;
  return {
    centerY: bottom + height / 2,
    height,
    bottom,
    top: bottom + height,
  };
}
