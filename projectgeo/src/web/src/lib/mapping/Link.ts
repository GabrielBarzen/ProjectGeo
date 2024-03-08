import L, { LatLng, type LatLngExpression } from "leaflet"
import type { Graph, Vertex } from "./Graphs"
import type { ResourceGraph } from "../game/ResourceGraph"
class Link {
  firstVertex: Vertex
  secondVertex: Vertex
  clickLine: L.Polyline
  drawLine: L.Polyline
  resourceGraph: ResourceGraph
  assignedMap: L.Map | undefined
  debugIdentifier = Math.random() * 1000

  constructor(firstVertex: Vertex, secondVertex: Vertex, resourceGraph: ResourceGraph) {
    this.firstVertex = firstVertex
    this.secondVertex = secondVertex
    this.resourceGraph = resourceGraph
    var firstPosition: LatLngExpression = [firstVertex.y, firstVertex.x] as LatLngExpression
    var secondPosition: LatLngExpression = [secondVertex.y, secondVertex.x] as LatLngExpression
    this.clickLine = L.polyline([firstPosition, secondPosition])
    this.drawLine = L.polyline([firstPosition, secondPosition])
    this.clickLine.setStyle({ color: "#555555", weight: 24, opacity: 0.0 })
    this.drawLine.setStyle({ color: "#111111", weight: 6, opacity: 0.8 })
  }

  updatePosition(firstPosition?: LatLngExpression, secondPosition?: LatLngExpression) {
    if (firstPosition && secondPosition) {
      this.clickLine.setLatLngs([firstPosition, secondPosition])
      this.drawLine.setLatLngs([firstPosition, secondPosition])
    } else if (secondPosition) {
      this.clickLine.setLatLngs([this.clickLine.getLatLngs().at(0) as LatLngExpression, secondPosition])
      this.drawLine.setLatLngs([this.clickLine.getLatLngs().at(0) as LatLngExpression, secondPosition])
    } else if (firstPosition) {
      this.clickLine.setLatLngs([firstPosition, this.clickLine.getLatLngs().at(1) as LatLngExpression])
      this.drawLine.setLatLngs([firstPosition, this.clickLine.getLatLngs().at(1) as LatLngExpression])
    }
  }
  setDrawLineStyle(style: Object) {
    this.drawLine.setStyle(style)
  }
  setClickLineStyle(style: Object) {
    this.clickLine.setStyle(style)
  }
  setOnClickFunction(onClickCallback: (graph: Graph, pressedEdge: [Vertex, Vertex], position: LatLng) => void) {
    this.clickLine.clearAllEventListeners()
    this.clickLine.on("click", (e) => {
      onClickCallback(this.resourceGraph.graph, [this.firstVertex, this.secondVertex], e.latlng)
    })
  }
  renderTo(map?: L.Map) {
    this.assignedMap = map
    this.assignedMap?.addLayer(this.drawLine)
    this.assignedMap?.addLayer(this.clickLine)
  }
  clear() {
    this.assignedMap?.removeLayer(this.drawLine)
    this.assignedMap?.removeLayer(this.clickLine)
  }


}
export { Link }
