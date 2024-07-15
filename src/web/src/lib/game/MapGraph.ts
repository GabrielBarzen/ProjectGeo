import type { Graph, Vertex } from "$lib/mapping/Graphs";
import { VertexMarker } from "$lib/mapping/VertexMarker";
import L from "leaflet";
import { GraphRenderer } from "./AreaRenderer";
import { Link } from "$lib/mapping/Link";

class MapGraph extends GraphRenderer implements Graph {
  setLineClickEvent(arg0: () => void): void {
    this.links.forEach(links => {
      links.forEach(link => {
        link.clickLine.on("click", () => { arg0() })
      })
    })

  }

  renderMarkers: boolean = false;
  setTitle(name: string) {
    this.titleIcon = new L.DivIcon({ html: `<b>${name}</b>` })
    this.titleMarker = new L.Marker([this.centerLat, this.centerLng], { icon: this.titleIcon })

  }
  toGraph(): Graph {
    return <Graph>({
      id: this.id,
      centerLat: this.centerLat,
      centerLng: this.centerLng,
      vertices: Array.from(this.vertexMarkers.values()).map(marker => marker.toVertex()),
    })
  }

  constructor(
    graph: Graph,
    primaryLineColor: string = '#555555',
    clickLineColor: string = '#111111',
    renderClickLine: boolean = false
  ) {
    super(primaryLineColor, clickLineColor, renderClickLine)
    this.id = graph.id
    this.vertexMarkers = new Map()
    this.vertices = graph.vertices
    this.centerLat = graph.centerLat
    this.centerLng = graph.centerLng
    this.links = new Map()
  }

  links: Map<string, Link[]>
  id: string;
  private _vertices: Vertex[] = [];
  public get vertices(): Vertex[] {
    return Array.from(this.vertexMarkers.values()).map(vertexMarker => { return vertexMarker.toVertex() })
  }
  public set vertices(value: Vertex[]) {
    this.vertexMarkers = new Map(value.map(vertex =>
      [vertex.id, new VertexMarker(vertex)] as const
    ))
  }

  vertexMarkers: Map<string, VertexMarker> = new Map();
  centerLat: number;
  centerLng: number;

  titleIcon: L.DivIcon | undefined
  titleMarker: L.Marker | undefined

  addVertex(lat: number, lng: number): Vertex {
    throw new Error("Method not implemented.");
  }
  removeVertex(vertex: Vertex): Vertex {
    throw new Error("Method not implemented.");
  }
  splitLine(sourceVertex: Vertex, destinationVertex: Vertex, position: L.LatLng): void {
    throw new Error("Method not implemented.");
  }


  createLinks() {
    const checkSet: Set<string> = new Set();
    for (const vertexMarker of this.vertexMarkers.values()) {
      for (const vertexId of vertexMarker.connections) {
        const checkList = [vertexId, vertexMarker.id].sort().toString();
        if (checkSet.has(checkList)) {
          continue;
        }
        checkSet.add(checkList);
        const connectedVertexMarker = this.vertexMarkers.get(vertexId)
        if (!connectedVertexMarker) {
          continue //TODO: handle error instead
        }
        this.addLink(vertexMarker, connectedVertexMarker)
      }
    }
  }

  addLink(firstVertex: VertexMarker, secondVertex: VertexMarker) {
    if (!firstVertex || !secondVertex) {
      return;
    }
    const vertices = [firstVertex, secondVertex];
    const link: Link = new Link(vertices[0], vertices[1]);
    if (this.renderClickLine) {
      link.setClickLineStyle({ color: super.clickLineColor, weight: 24, opacity: 0.2 });
    } else {
      link.setClickLineStyle({ color: super.clickLineColor, weight: 24, opacity: 0.0 });
    }
    link.setDrawLineStyle({ color: super.primaryLineColor, weight: 6, opacity: 0.8 });

    const firstLinkEntry = this.links.get(firstVertex.id);
    const secondLinkEntry = this.links.get(secondVertex.id);

    if (!firstLinkEntry) {
      this.links.set(firstVertex.id, [link]);
      firstVertex.connectLink(link)
    }
    if (!secondLinkEntry) {
      this.links.set(secondVertex.id, [link]);
      secondVertex.connectLink(link)
    }
    if (!firstLinkEntry && !secondLinkEntry) return;

    vertices.forEach(vertex => {
      const connectedLinkList = this.links.get(vertex.id)
      if (!connectedLinkList) {
        return
      }
      if (connectedLinkList.includes(link)) {
        return
      }
      connectedLinkList.push(link)
      vertex.connectLink(link)
      if (connectedLinkList.length > 2) {
        throw Error("More than two links not allowed in MapGraph")
      }
    })
  }

  assignedMap: L.Map | undefined
  renderTo(map: L.Map) {
    this.createLinks()
    this.assignedMap = map
    this.vertexMarkers.forEach(vertex => {
      if (this.renderMarkers) {
        vertex.renderTo(this.assignedMap!)
      }
      this.links.get(vertex.id)?.forEach(link => { link.renderTo(this.assignedMap!) })
    })
    if (this.titleMarker) {

      this.assignedMap.addLayer(this.titleMarker)
    }


  }

  clear() {
    if (!this.assignedMap) {
      return
    }

    this.vertexMarkers.forEach(vertex => {
      vertex.clear()
      this.links.get(vertex.id)?.forEach(link => { link.clear() })
    })
    if (this.titleMarker) {
      this.assignedMap.removeLayer(this.titleMarker)
    }
  }
}

export { MapGraph }
