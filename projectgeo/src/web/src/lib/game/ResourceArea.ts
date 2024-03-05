import { type Area, type Vertex, type Graph } from '../mapping/Graphs';
import { Link } from '../mapping/Link'
import L, { type LatLngExpression } from 'leaflet'

class ResourceArea {
  links: Link[] = [];
  lines: L.Polyline[] = [];

  primaryLineColor: string = "#FFFFFF";
  debugLineColor: string = "#000000";
  renderDebugLine: boolean = false;

  assignedMap: L.Map
  constructor(primaryLineColor: string, debugLineColor: string, renderDebugLine: boolean) {
    this.primaryLineColor = primaryLineColor;
    this.debugLineColor = debugLineColor
    this.renderDebugLine = renderDebugLine;
  }

  clear() {
    if (!(this.assignedMap == null)) {
      this.links.forEach(element => {
        this.assignedMap.removeLayer(element)
      });
      this.lines.forEach(element => {
        this.assignedMap.removeLayer(element)
      });
    }
  }

  createLinks(area: Area) {
    var checkSet: Set<string[]> = new Set()
    for (const graph of area.graphs.values()) {
      for (const vertex of graph.vertices.values()) {
        console.log(vertex)
        for (const vertexId of vertex.connections) {
          var checkList = [vertexId, vertex.id].sort()
          if (!checkSet.has(checkList)) {
            checkSet.add(checkList)
            var connectedVertex: Vertex | undefined = graph.vertices.get(vertexId)
            if (connectedVertex != undefined) {
              var firstCoord: number[] = [vertex.y, vertex.x]
              var secondCoord: number[] = [connectedVertex.y, connectedVertex.x]

              var link: Link = new Link(firstCoord, secondCoord, vertex.id, connectedVertex.id)


              if (this.renderDebugLine) {
                link.setStyle({ color: this.debugLineColor, weight: 24, opacity: 0.2 })
              } else {
                link.setStyle({ color: this.debugLineColor, weight: 24, opacity: 0.0 })
              }

              var line = new L.Polyline([link.first as LatLngExpression, link.second as LatLngExpression])
              line.setStyle({ color: this.primaryLineColor, weight: 6, opacity: 0.8 })

              this.lines.push(line)
              this.links.push(link)
            }
          }
        }
      }
    }
  }

  renderTo(map: L.Map) {
    this.assignedMap = map;
    for (const link of this.links) {
      map.addLayer(link)
    }
    for (const line of this.lines) {
      map.addLayer(line)
    }
  }


}
export { ResourceArea }
