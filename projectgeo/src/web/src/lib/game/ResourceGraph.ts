import { Marker } from 'svelte-maplibre';
import { type Area, type Vertex, type Graph } from '../mapping/Graphs';
import { Link } from '../mapping/Link'
import L, { map, type LatLngExpression, LatLng } from 'leaflet'
import { VertexMarker } from '../mapping/VertexMarker';
import type { ResourceArea } from './ResourceArea';

class ResourceGraph {
  links: Map<string, [Vertex, [Link]]> = new Map;
  vertexMarkers: Map<string, [Vertex, VertexMarker]> = new Map;

  primaryLineColor: string
  debugLineColor: string
  renderClickLine: boolean
  graph: Graph
  assignedMap: L.Map | undefined

  parentArea: ResourceArea
  constructor(
    parentArea: ResourceArea,
    graph: Graph,
    primaryLineColor: string = "#555555",
    clickLineColor: string = "#111111",
    renderClickLine: boolean = false) {
    this.primaryLineColor = primaryLineColor;
    this.debugLineColor = clickLineColor;
    this.renderClickLine = renderClickLine;
    this.graph = graph
    this.parentArea = parentArea
    this.createLinks()
  }



  createLinks() {
    var checkSet: Set<string[]> = new Set()
    for (const vertex of this.graph.vertices.values()) {
      for (const vertexId of vertex.connections) {
        var checkList = [vertexId, vertex.id].sort()
        if (checkSet.has(checkList)) {
          continue
        }
        checkSet.add(checkList)
        var connectedVertex: Vertex | undefined = this.graph.vertices.get(vertexId)
        if (connectedVertex == undefined) {
          continue
        }

        this.addLink(vertex, connectedVertex)
      }
    }
  }
  private addLink(firstVertex: Vertex, secondVertex: Vertex) {

    var vertices = [firstVertex, secondVertex]
    var link: Link = new Link(vertices[0], vertices[1], this)
    link.setClickLineStyle({ color: this.debugLineColor, weight: 24, opacity: 0.2 })
    link.setDrawLineStyle({ color: this.primaryLineColor, weight: 6, opacity: 0.8 })

    vertices.forEach(vertex => {
      if (!this.links.has(vertex.id)) {
        var linkLineList: [Link] = [link]
        this.links.set(vertex.id, [vertex, linkLineList])
        return
      }
      var vertexLinkEntry = this.links.get(vertex.id)
      if (!vertexLinkEntry) {
        return
      }
      var vertexLink = vertexLinkEntry[1]
      if (vertexLink.length > 2) {
        throw new Error("Vertex belongs to more than two links")
      }
      var containsLink = false
      vertexLink.forEach(checkLink => {
        if (checkLink.firstVertex.id == link.firstVertex.id && checkLink.secondVertex.id == link.secondVertex.id) {
          containsLink = true;
        }
      })
      if (!containsLink) {
        vertexLink.push(link)
      }
    });

  }

  renderTo(map: L.Map) {
    this.assignedMap = map;
    if (this.assignedMap == undefined) {
      return
    }

    this.links.forEach(layerValue => {
      var lineLinkList: [Link] = layerValue[1]
      lineLinkList.forEach(element => {
        var link = element
        if (link) {
          link.clear()
          link.renderTo(this.assignedMap)
        }
      })
    })
  }

  addMarkers(draggable: boolean) {
    this.links.forEach(layerValue => {
      var vertex = layerValue[0]
      var marker = new VertexMarker(this, vertex, [vertex.y, vertex.x])
      var onPhone = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      if (draggable && !onPhone) {
        marker.on('mousedown', () => {
          this.assignedMap?.dragging.disable()
          this.assignedMap?.on('mousemove', (event) => {
            var newLatLng = event.latlng
            marker.setLatLng(newLatLng)
            var layer = this.links.get(vertex.id)
            if (layer) {
              layer[1].forEach(link => {
                if (vertex.id == link.firstVertex.id) {
                  link.updatePosition(newLatLng)
                } else {
                  link.updatePosition(undefined, newLatLng)
                }
              });
            }
          })
        })
        marker.on('mouseup', () => {
          this.assignedMap?.dragging.enable()
          this.assignedMap?.removeEventListener('mousemove')
        })
        this.assignedMap?.addLayer(marker)

      } else if (draggable && onPhone) {
        this.addPhoneDragFunction(marker, vertex)

      } else {
        marker.on("click", () => {
          this.assignedMap?.addLayer(marker)
        })
      }
      this.vertexMarkers.set(vertex.id, [vertex, marker])
    })
  }
  addPhoneDragFunction(marker: VertexMarker, vertex: Vertex) {
    marker.addOneTimeEventListener("click", (markerEvent) => {
      this.assignedMap?.addOneTimeEventListener("click", (mapEvent) => {

        if (marker.getLatLng().distanceTo(mapEvent.latlng) < 100) {
          marker.setDragged(false)
          marker.clearAllEventListeners()
        } else {
          marker.setDragged(true)
          marker.setLatLng(mapEvent.latlng)
          var newLatLng = mapEvent.latlng
          var layer = this.links.get(vertex.id)
          if (layer) {
            layer[1].forEach(link => {
              if (vertex.id == link.firstVertex.id) {
                link.updatePosition(newLatLng)
              } else {
                link.updatePosition(undefined, newLatLng)
              }
            });
          }
        }
        marker.clearAllEventListeners()
        this.addPhoneDragFunction(marker, vertex)
      })
    })
    this.assignedMap?.addLayer(marker)
  }

  clear() {
    this.links.forEach(layerValue => {
      var lineLinkList: [Link] = layerValue[1]
      lineLinkList.forEach(element => {
        var link = element
        if (link) {
          link.clear()
        }
      });
    });
    this.vertexMarkers.forEach(markerValue => {
      this.assignedMap?.removeLayer(markerValue[1])
    })
  }


  setOnLineClickFunction(onLineClickFunction: (graph: Graph, pressedLink: [Vertex, Vertex], position: LatLng) => void) {
    this.links.forEach((linkEntry) => {
      linkEntry[1].forEach((link) => {
        link.setOnClickFunction(onLineClickFunction)
      })

    })
  }

  setOnVertexClickFunction(onVertexClickFunction: (vertex: Vertex) => void) {
    this.vertexMarkers.forEach((entry) => {
      var marker = entry[1]
      if (marker) {
        marker.setOnVertexClickFunction(onVertexClickFunction)
      }
    })
  }

  setOnVertexDragFunction(onVertexDragFunction: (vertex: Vertex) => void) {
    this.vertexMarkers.forEach((entry) => {
      var marker = entry[1]
      if (marker) {
        marker.setOnVertexDragFunction(onVertexDragFunction)
      }
    })
  }

}

export { ResourceGraph }