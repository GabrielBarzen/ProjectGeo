import { type Vertex, type Graph } from '../mapping/Graphs';
import { Link } from '../mapping/Link'
import L, { LatLng } from 'leaflet'
import { VertexMarker } from '../mapping/VertexMarker';
import type { ResourceArea } from './ResourceArea';

class ResourceGraph {
  links: Map<string, [Vertex, Link[]]> = new Map;
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
  }

  createLinks() {
    const checkSet: Set<string> = new Set()
    this.links.clear()
    for (const vertex of this.graph.vertices.values()) {
      for (const vertexId of vertex.connections) {
        const checkList = [vertexId, vertex.id].sort().toString()
        if (checkSet.has(checkList)) {
          continue
        }
        checkSet.add(checkList)
        const connectedVertex: Vertex | undefined = this.graph.vertices.get(vertexId)
        if (connectedVertex == undefined) {
          continue
        }

        this.addLink(vertex, connectedVertex)
      }
    }
  }

  private addLink(firstVertex: Vertex, secondVertex: Vertex) {

    const vertices = [firstVertex, secondVertex]
    const link: Link = new Link(vertices[0], vertices[1], this)
    link.setClickLineStyle({ color: this.debugLineColor, weight: 24, opacity: 0.2 })
    link.setDrawLineStyle({ color: this.primaryLineColor, weight: 6, opacity: 0.8 })

    const firstLinkEntry = this.links.get(firstVertex.id)
    const secondLinkEntry = this.links.get(secondVertex.id)

    if (!firstLinkEntry) {
      this.links.set(firstVertex.id, [firstVertex, [link]])
    }
    if (!secondLinkEntry) {
      this.links.set(secondVertex.id, [secondVertex, [link]])
    }
    if (!firstLinkEntry && !secondLinkEntry) return

    const entries = [this.links.get(firstVertex.id), this.links.get(secondVertex.id)]

    entries.forEach((entry) => {
      if (!entry) {
        throw new Error("Vertex entry still undefined after setting")
      }

      if (!entry[1].includes(link)) {
        entry[1].push(link)
      }

      this.links.set(entry[0].id, [entry[0], entry[1]])
    })

  }

  renderTo(map: L.Map) {
    this.createLinks()
    this.assignedMap = map;

    if (this.assignedMap == undefined) {
      return
    }

    this.links.forEach(layerValue => {
      const lineLinkList: Link[] = layerValue[1]
      lineLinkList.forEach(element => {
        const link = element
        if (link) {
          link.clear()
          link.renderTo(this.assignedMap)
        }
      })
    })
  }


  addMarkers(draggable: boolean) {
    this.vertexMarkers.clear()
    this.links.forEach(layerValue => {
      const vertex = layerValue[0]
      const marker = new VertexMarker(this, vertex, [vertex.y, vertex.x])
      marker.setStyle({ weight: 4 })
      const onPhone = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      if (draggable && !onPhone) {
        marker.on('mousedown', () => {
          this.assignedMap?.dragging.disable()
          this.assignedMap?.on('mousemove', (event) => {
            const newLatLng = event.latlng
            marker.setLatLng(newLatLng)
            const layer = this.links.get(vertex.id)
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
    marker.addOneTimeEventListener("click", () => {
      this.assignedMap?.addOneTimeEventListener("click", (mapEvent) => {

        if (marker.getLatLng().distanceTo(mapEvent.latlng) < 100) {
          marker.setDragged(false)
          marker.clearAllEventListeners()
        } else {
          marker.setDragged(true)
          marker.setLatLng(mapEvent.latlng)
          const newLatLng = mapEvent.latlng
          const layer = this.links.get(vertex.id)
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
      const lineLinkList: Link[] = layerValue[1]
      lineLinkList.forEach(element => {
        const link = element
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
      console.log(linkEntry);
      console.log(linkEntry[0]);
      console.log(linkEntry[1]);

    })

    this.links.forEach((linkEntry) => {
      linkEntry[1].forEach((link) => {
        link.setOnClickFunction(onLineClickFunction)
      })

    })
  }

  setOnVertexClickFunction(onVertexClickFunction: (vertex: Vertex) => void) {
    this.vertexMarkers.forEach((entry) => {
      const marker = entry[1]
      if (marker) {
        marker.setOnVertexClickFunction(onVertexClickFunction)
      }
    })
  }

  setOnVertexDragFunction(onVertexDragFunction: (vertex: Vertex) => void) {
    this.vertexMarkers.forEach((entry) => {
      const marker = entry[1]
      if (marker) {
        marker.setOnVertexDragFunction(onVertexDragFunction)
      }
    })
  }

}

export { ResourceGraph }
