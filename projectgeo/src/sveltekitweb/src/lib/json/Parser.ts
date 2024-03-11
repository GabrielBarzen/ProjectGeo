
import { type Area, type Graph } from "../mapping/Graphs"


export function parseAreaJSON(areaJSON: any): Area {
  const area: Area = areaJSON
  area.graphs = new Map(Object.entries(area.graphs))
  for (const graph of area.graphs.values()) {
    graph.vertices = new Map(Object.entries(graph.vertices))
  }
  return area
}

export function parseAreaJSONList(areaJSONList: any[]): Area[] {
  const areaList: Area[] = areaJSONList.map((areaJSON) => parseAreaJSON(areaJSON));
  return areaList
}




export function parseGraphJSON(graphData: any): import("../mapping/Graphs").Graph {
  const graph: Graph = graphData
  graph.vertices = new Map(Object.entries(graph.vertices))
  return graph;
}

