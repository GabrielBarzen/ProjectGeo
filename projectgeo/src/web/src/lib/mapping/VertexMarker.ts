
import L from "leaflet"
import type { Vertex } from "./Graphs"
import type { ResourceGraph } from "../game/ResourceGraph"
import type { Link } from "./Link"
class VertexMarker extends L.Circle {
  dragged = false
  parentGraph: ResourceGraph
  vertex: Vertex
  onMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  assignedMap: L.Map | undefined
  clickedFunction: (vertex: Vertex) => void = () => {
    console.log("No click function defined ");
  }
  draggedFunction: (vertex: Vertex) => void = () => {
    console.log("No drag function defined ");
  }
  connectedLinks: Link[]

  constructor(parent: ResourceGraph, vertex: Vertex, latLng: L.LatLngExpression, connectedLinks: Link[]) {
    super(latLng)
    this.parentGraph = parent
    this.vertex = vertex
    this.setRadius(25)
    this.setClickDragBehaviour()
    this.connectedLinks = connectedLinks
  }

  setClickDragBehaviour() {
    if (this.onMobile) {
      this.setClickDragBehaviourTouch()
      return
    }
    this.on("mousedown", () => {
      this.assignedMap?.dragging.disable()
      this.setDragged(false)
      this.assignedMap?.on("mousemove", (mapMouseMoveEvent) => {
        this.setDragged(true)
        this.setLatLng(mapMouseMoveEvent.latlng)
        this.vertex.y = mapMouseMoveEvent.latlng.lat
        this.vertex.x = mapMouseMoveEvent.latlng.lng
        this.updateLinkPosition()
      })
      this.on("mouseup", () => {
        this.removeEventListener("mousedown")
        this.removeEventListener("mousemove")
        this.removeEventListener("mouseup")
        this.assignedMap?.removeEventListener("mousemove")
        this.assignedMap?.dragging.enable()
        this.executeInteractFunction()
        this.dragged = false
      })
    })
  }

  executeInteractFunction() {
    if (!this.dragged) {
      console.log("Clicked");

      this.clickedFunction(this.vertex)
    } else {
      console.log("Dragged");
      this.draggedFunction(this.vertex)
    }
  }

  setClickDragBehaviourTouch() {

  }


  updateLinkPosition() {
    this.connectedLinks.forEach((link) => {
      if (link.firstVertex.id == this.vertex.id) {
        link.updatePosition(this.getLatLng())
      } else if (link.secondVertex.id == this.vertex.id) {
        link.updatePosition(undefined, this.getLatLng())
      }
    })

  }

  getDragged() {
    return this.dragged
  }
  setDragged(dragged: boolean) {
    this.dragged = dragged
  }

  renderTo(map: L.Map) {
    this.assignedMap = map
    map.addLayer(this)
  }
  clear() {
    if (this.assignedMap) {
      this.assignedMap!.removeLayer(this)
    }
  }


}

export { VertexMarker }
