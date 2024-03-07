
import { type Area } from "../mapping/Graphs"


export function parseAreaJSON(areaJSON: any): Area {
  var area: Area = areaJSON
  area.graphs = new Map(Object.entries(area.graphs))
  for (const graph of area.graphs.values()) {
    graph.vertices = new Map(Object.entries(graph.vertices))
  }
  return area
}

export function parseAreaJSONList(areaJSONList: any[]): Area[] {
  var areaList: Area[] = areaJSONList.map((areaJSON) => parseAreaJSON(areaJSON));
  return areaList
}


