
import { type Area, type Vertex, type Graph } from '../mapping/Graphs';
import L, { LatLng, type LatLngExpression } from 'leaflet'
import { ResourceGraph } from './ResourceGraph';

class ResourceArea {

  resourceGraphs: ResourceGraph[] = []
  assignedMap: L.Map | undefined
  id: string
  constructor(area: Area,
    primaryLineColor: string = "#555555",
    clickLineColor: string = "#111111",
    renderClickLine: boolean = false) {
    this.id = area.id
    area.graphs.forEach(graph => {
      var resourceGraph = new ResourceGraph(this, graph, primaryLineColor, clickLineColor, renderClickLine)

      this.resourceGraphs.push(resourceGraph)
    })

  }
  setOnLineClickFunction(onLineClickFunction?: (graph: Graph, pressedLink: [Vertex, Vertex], position: LatLng) => void) {
    if (onLineClickFunction) {
      this.resourceGraphs.forEach((resourceGraph) => {
        resourceGraph.setOnLineClickFunction(onLineClickFunction)
      })
    }
  }

  addMarkers(
    onVertexClickFunction: (vertex: Vertex) => void,
    onVertexDragFunction: (vertex: Vertex) => void,
    draggable: boolean = true
  ) {
    this.resourceGraphs.forEach(graph => {
      graph.addMarkers(draggable)
      graph.setOnVertexDragFunction(onVertexDragFunction)
      graph.setOnVertexClickFunction(onVertexClickFunction)


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
