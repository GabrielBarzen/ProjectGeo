import { type Area, type Vertex } from '../mapping/Graphs';

export function parseAreaJSON(areaJSON: any): Area {
  const area: Area = areaJSON;

  area.vertices = new Map(Object.entries(graph.vertices));

  return area;
}

export function parseAreaJSONList(areaJSONList: any[]): Area[] {
  const areaList: Area[] = areaJSONList.map((areaJSON) => parseAreaJSON(areaJSON));
  return areaList;
}

export function parseGraphJSON(graphData: any): import('../mapping/Graphs').Area {
  const graph: Area = graphData;
  graph.vertices = new Map(Object.entries(graph.vertices));
  return graph;
}
