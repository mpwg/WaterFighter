import {expect,it,vi} from 'vitest';
import {groundRoads,terrainHeight} from '../src/render/roads';
import {World} from '../src/render/world';
import type {Scenario} from '../src/scenario';

it('interpoliert die beiden Geländedreiecke und begrenzt Randkoordinaten',()=>{
 const bed=[0,4,8,16];
 expect(terrainHeight(1,1,2,2,4,bed)).toBe(3);
 expect(terrainHeight(3,3,2,2,4,bed)).toBe(11);
 expect(terrainHeight(8,8,2,2,4,bed)).toBe(16);
});

it('unterteilt ebenerdige Wege und lässt Brücken und Tunnel ohne Höheninformation aus',()=>{
 const scenario={grid:{cellSize:4},roads:[{id:'ground',kind:'residential',points:[[0,0],[8,0]]},{id:'bridge',kind:'footway',points:[[0,2],[8,2]]},{id:'tunnel',kind:'service',points:[[0,4],[8,4]]}],crossings:[{id:'bridge'},{id:'tunnel'}]} as unknown as Scenario;
 expect(groundRoads(scenario)).toEqual([[[0,0],[2,0],[4,0],[6,0],[8,0]]]);
});

it('passt Straßendarstellung bei verändertem Gelände an',()=>{
 const positions=new Float32Array([-4,0,-4,0,0,0]),update=vi.fn();
 const world={width:2,height:2,cell:4,bed:[0,0,0,0],terrainRevision:-1,landPositions:new Float32Array(27),land:{updateVerticesData:vi.fn()},roads:{updateVerticesData:update},roadPositions:positions,
  scenario:{surveyCrests:[]},scene:{getMeshByName:()=>null},updateSurveyRidges:vi.fn(),updateTrenches:vi.fn(),damSignature:'[]'} as any;
 World.prototype.updateState.call(world,new Float32Array([2,0,0,3]),[],[],1,[]);
 expect(positions[1]).toBeCloseTo(2.05);expect(positions[4]).toBeCloseTo(3.05);expect(update).toHaveBeenCalledOnce();
});

it('überträgt unverändertes Gelände bei anderen Aktionen nicht erneut und aktualisiert Gebäude',()=>{
 const landUpdate=vi.fn(),roadUpdate=vi.fn(),surveyUpdate=vi.fn(),setEnabled=vi.fn();
 const world={width:2,height:2,cell:4,bed:[0,0,0,0],terrainRevision:0,landPositions:new Float32Array(27),land:{updateVerticesData:landUpdate},roads:{updateVerticesData:roadUpdate},roadPositions:new Float32Array([-4,0,-4]),
  scenario:{surveyCrests:[]},buildingMaterials:{verloren:{}},buildingMeshes:new Map([['house',{setEnabled}]]),updateSurveyRidges:surveyUpdate,updateTrenches:vi.fn(),damSignature:'[]'} as any;
 World.prototype.updateState.call(world,new Float32Array([0,0,0,0]),[{id:'house',value:1,damage:0,demolished:true,exposure:0}],[],1,[]);
 expect(landUpdate).not.toHaveBeenCalled();expect(roadUpdate).not.toHaveBeenCalled();expect(surveyUpdate).not.toHaveBeenCalled();
 expect(setEnabled).toHaveBeenCalledWith(false);expect(world.currentBuildings.get('house').demolished).toBe(true);
 World.prototype.updateState.call(world,new Float32Array([-1,0,0,0]),[{id:'house',value:1,damage:0,demolished:true,exposure:0}],[],2,[]);
 expect(landUpdate).toHaveBeenCalledOnce();expect(roadUpdate).toHaveBeenCalledOnce();expect(surveyUpdate).toHaveBeenCalledOnce();
 expect(world.roadPositions[1]).toBeCloseTo(-0.95);
});

it('aktualisiert den Gebäudezustand auch ohne neue Aktionsrevision',()=>{
 const mesh={material:null},materials={unbeschädigt:{},gefährdet:{},beschädigt:{},verloren:{}};
 const world={terrainRevision:3,buildingMaterials:materials,buildingMeshes:new Map([['house',mesh]])} as any;
 const b={id:'house',value:100,damage:0,demolished:false,exposure:0};
 World.prototype.updateState.call(world,new Float32Array(),[b],[],3,[]);expect(mesh.material).toBe(materials.unbeschädigt);
 World.prototype.updateState.call(world,new Float32Array(),[{...b,exposure:0.1,damage:1}],[],3,[]);expect(mesh.material).toBe(materials.gefährdet);
 World.prototype.updateState.call(world,new Float32Array(),[{...b,damage:20}],[],3,[]);expect(mesh.material).toBe(materials.beschädigt);
 World.prototype.updateState.call(world,new Float32Array(),[{...b,damage:100}],[],3,[]);expect(mesh.material).toBe(materials.verloren);
});
