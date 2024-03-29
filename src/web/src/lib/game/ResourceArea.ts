
import { type Area, type Vertex, type Graph } from '../mapping/Graphs';
import L, { LatLng } from 'leaflet'
import { ResourceGraph } from './ResourceGraph';

class ResourceArea {

  resourceGraphs: Map<string, ResourceGraph> = new Map
  assignedMap: L.Map | undefined
  id: string
  name: string
  constructor(area: Area,
    primaryLineColor: string = "#555555",
    clickLineColor: string = "#111111",
    renderClickLine: boolean = false) {
    this.name = area.name
    this.id = area.id
    area.graphs.forEach(graph => {
      const resourceGraph = new ResourceGraph(this, graph, primaryLineColor, clickLineColor, renderClickLine)

      this.resourceGraphs.set(resourceGraph.graph.id, resourceGraph)
    })

  }
  setOnLineClickFunction(onLineClickFunction?: (graph: Graph, pressedLink: [Vertex, Vertex], position: LatLng) => void) {
    if (onLineClickFunction) {
      this.resourceGraphs.forEach((resourceGraph) => {
        resourceGraph.setOnLineClickFunction(onLineClickFunction)
      })
    }
  } setRenderDebugLine(renderDebugLine: boolean) {
    this.resourceGraphs.forEach((line) => {
      line.renderClickLine = renderDebugLine
    })
  }

  addMarkers(
    onVertexClickFunction: (vertex: Vertex) => void,
    onVertexDragFunction: (vertex: Vertex) => void,
    draggable: boolean = true
  ) {
    this.resourceGraphs.forEach(graph => {
      graph.addMarkers(draggable, onVertexClickFunction, onVertexDragFunction)



    });
  }

  renderTo(map: L.Map) {
    this.assignedMap = map
    this.resourceGraphs.forEach((graph) => {
      if (this.assignedMap) {
        graph.renderTo(this.assignedMap)
      }
    })
  }
  clear() {
    this.resourceGraphs.forEach(element => {
      element.clear()
    });
  }


}

export { ResourceArea }
