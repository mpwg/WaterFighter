import type {BuildingStatus} from '../simulation/game';

/** Display categories use the authoritative damage and current boundary water depth. */
export function buildingCondition(b:BuildingStatus):'unbeschädigt'|'gefährdet'|'beschädigt'|'verloren' {
  if(b.demolished || b.damage>=b.value)return 'verloren';
  if(b.exposure>=0.05 && b.damage<b.value*0.05)return 'gefährdet';
  return b.damage>0?'beschädigt':'unbeschädigt';
}
