import { Marker } from 'svelte-maplibre';
import { type Area, type Vertex, type Graph } from '../mapping/Graphs';
import { Link } from '../mapping/Link'
import L, { map, type LatLngExpression } from 'leaflet'

class ResourceArea {
  layers: Map<string, [Vertex, [Link]]> = new Map;
  draggableMarkers: Map<string, [Vertex, L.CircleMarker]> = new Map;

  primaryLineColor: string
  debugLineColor: string
  renderClickLine: boolean
  area: Area
  onClickFunction: (pressedLink: Link) => void

  assignedMap: L.Map | undefined
  constructor(area: Area, onClickFunction: (pressedLink: Link) => void, primaryLineColor: string = "#555555", clickLineColor: string = "#111111", renderClickLine: boolean = false) {
    this.primaryLineColor = primaryLineColor;
    this.debugLineColor = clickLineColor;
    this.renderClickLine = renderClickLine;
    this.area = area;
    this.onClickFunction = onClickFunction
    this.createLinks(area)
  }



  createLinks(area: Area) {
    var checkSet: Set<string[]> = new Set()
    for (const graph of area.graphs.values()) {
      for (const vertex of graph.vertices.values()) {
        for (const vertexId of vertex.connections) {
          var checkList = [vertexId, vertex.id].sort()
          if (checkSet.has(checkList)) {
            continue
          }
          checkSet.add(checkList)
          var connectedVertex: Vertex | undefined = graph.vertices.get(vertexId)
          if (connectedVertex == undefined) {
            continue
          }

          this.addLink(vertex, connectedVertex)
        }
      }
    }
  }
  private addLink(firstVertex: Vertex, secondVertex: Vertex) {

    var vertices = [firstVertex, secondVertex]
    var link: Link = new Link(vertices[0], vertices[1], this)
    link.setClickLineStyle({ color: this.debugLineColor, weight: 24, opacity: 0.2 })
    link.setDrawLineStyle({ color: this.primaryLineColor, weight: 6, opacity: 0.8 })
    link.setOnClickFunction(this.onClickFunction)

    vertices.forEach(vertex => {
      if (!this.layers.has(vertex.id)) {
        var linkLineList: [Link] = [link]
        this.layers.set(vertex.id, [vertex, linkLineList])
        return
      }
      var vertexLinkEntry = this.layers.get(vertex.id)
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

    this.layers.forEach(layerValue => {
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

  addDraggableMarkers() {
    this.layers.forEach(layerValue => {
      var vertex = layerValue[0]
      var marker = L.circleMarker([vertex.y, vertex.x])

      marker.on('mousedown', () => {
        this.assignedMap?.dragging.disable()
        this.assignedMap?.on('mousemove', (event) => {
          var newLatLng = event.latlng
          marker.setLatLng(newLatLng)
          var layer = this.layers.get(vertex.id)
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
    })
  }
  clear() {
    this.layers.forEach(layerValue => {
      var lineLinkList: [Link] = layerValue[1]
      lineLinkList.forEach(element => {
        var link = element
        if (link) {
          link.clear()
        }
      });
    });
  }
}

export { ResourceArea }
