import type {BuildingStatus} from '../simulation/game';

/** Preserve the distinction between zero and a positive amount that rounds to zero. */
export function displayDamage(value:number):string {
  return value>0 && value<0.5 ? '< 1' : Math.round(value).toLocaleString('de-AT');
}

/** Display categories use the authoritative damage and current boundary water depth. */
export function buildingCondition(b:BuildingStatus):'unbeschädigt'|'gefährdet'|'beschädigt'|'verloren' {
  if(b.demolished || b.damage>=b.value)return 'verloren';
  if(b.exposure>=0.05 && b.damage<b.value*0.05)return 'gefährdet';
  return b.damage>0?'beschädigt':'unbeschädigt';
}
