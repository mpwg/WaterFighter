export interface SmallBuildingBox { id:string; left:number; right:number; top:number; bottom:number }

/** Only return an unambiguous small target near an otherwise empty click. */
export function uniqueSmallBuilding(boxes:SmallBuildingBox[],x:number,y:number):string|undefined {
  const margin=8,maximumSize=16;
  const hits=boxes.filter(b=>b.right>=b.left && b.bottom>=b.top && b.right-b.left<=maximumSize && b.bottom-b.top<=maximumSize &&
    x>=b.left-margin && x<=b.right+margin && y>=b.top-margin && y<=b.bottom+margin);
  return hits.length===1?hits[0].id:undefined;
}
