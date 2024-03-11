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
  drawLineStyle: L.PolylineOptions = { color: "#555555", weight: 24, opacity: 0.0 }
  clickLineStyle: L.PolylineOptions = { color: "#111111", weight: 6, opacity: 0.8 }

  constructor(firstVertex: Vertex, secondVertex: Vertex, resourceGraph: ResourceGraph) {
    this.firstVertex = firstVertex
    this.secondVertex = secondVertex
    this.resourceGraph = resourceGraph
    const firstPosition: LatLngExpression = [firstVertex.y, firstVertex.x] as LatLngExpression
    const secondPosition: LatLngExpression = [secondVertex.y, secondVertex.x] as LatLngExpression
    this.clickLine = L.polyline([firstPosition, secondPosition], this.clickLineStyle)
    this.drawLine = L.polyline([firstPosition, secondPosition], this.drawLineStyle)

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
  setDrawLineStyle(style: L.PolylineOptions) {
    this.drawLineStyle = style
    this.drawLine.setStyle(style)
  }
  setClickLineStyle(style: L.PolylineOptions) {
    this.clickLineStyle = style
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
