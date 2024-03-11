
import L from "leaflet"
import type { Vertex } from "./Graphs"
import type { ResourceGraph } from "../game/ResourceGraph"
class VertexMarker extends L.Circle {
  dragged = false
  parentGraph: ResourceGraph
  vertex: Vertex
  constructor(parent: ResourceGraph, vertex: Vertex, latLng: L.LatLngExpression) {
    super(latLng)
    this.parentGraph = parent
    this.vertex = vertex
    this.setRadius(25)
  }

  setOnVertexClickFunction(onVertexClickFunction: (vertex: Vertex) => void) {
    this.on("mousedown", () => {
      this.setDragged(false)
    })
    this.on("mousemove", () => {
      this.setDragged(true)
    })
    this.on("mouseup", () => {
      if (!this.dragged) {
        onVertexClickFunction(this.vertex)
      }
    })
  }

  setOnVertexDragFunction(onVertexDragFunction: (vertex: Vertex) => void) {
    this.on("mousedown", () => {
      this.setDragged(false)
    })
    this.on("mousemove", () => {
      this.setDragged(true)
    })
    this.on("mouseup", () => {
      if (this.dragged) {
        this.vertex.y = this.getLatLng().lat
        this.vertex.x = this.getLatLng().lng
        onVertexDragFunction(this.vertex)
        this.parentGraph.assignedMap?.removeLayer(this)
      }
    })
  }

  getDragged() {
    return this.dragged
  }
  setDragged(dragged: boolean) {
    this.dragged = dragged
  }

}

export { VertexMarker }
