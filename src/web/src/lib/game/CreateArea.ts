import { VertexMarker } from '$lib/mapping/VertexMarker';
import L from 'leaflet';
import { type Area, type Vertex } from '../mapping/Graphs';
import { Link } from '../mapping/Link';
import { AreaRenderer } from './AreaRenderer';

class CreateArea extends AreaRenderer implements Area {

  links: Link[] = [];

  constructor(
    area?: Area,
    primaryLineColor: string = '#555555',
    clickLineColor: string = '#111111',
    renderClickLine: boolean = false
  ) {
    super(primaryLineColor, clickLineColor, renderClickLine);
    if (area) {
      this.id = area.id
      this.vertices = area.vertices
      this.centerLat = area.centerLat
      this.centerLng = area.centerLng
    } else {
      this.id = "0"
      this.vertices = []
      this.centerLat = 0.0
      this.centerLng = 0.0
    }
    this._vertices.forEach(element => {
      this.vertexMarkers.push(new VertexMarker(element))
    });
  }

  id: string;
  private _vertices: Vertex[] = [];
  public get vertices(): Vertex[] {
    return this.vertexMarkers.map((marker) => { return marker as Vertex });
  }
  private set vertices(vertices: Vertex[]) {
    this.vertices = vertices
  }
  vertexMarkers: VertexMarker[] = [];

  centerLat: number;
  centerLng: number;


  addVertex(lat: number, lng: number, id?: string): Vertex {
    const vertex: Vertex = {
      id: id ? id : String(this.vertexMarkers.length),
      lat: lat,
      lng: lng,
      connections: []
    };
    console.log("adding vertex")
    console.log(vertex);
    const vertexMarker: VertexMarker = new VertexMarker(vertex)



    if (!id) {
      this.vertexMarkers.push(vertexMarker);
    } else {
      if (!Number(id)) {
        this.vertexMarkers.push(vertexMarker);
        return vertexMarker
      }
      this.vertexMarkers.splice(Number(id!), 0, vertexMarker);
    }
    return vertexMarker;
  }
  removeVertex(vertex: Vertex): Vertex {
    if (this.vertexMarkers.length <= 3) {
      return vertex
    }

    const removedVertex = this.vertexMarkers.splice(Number(vertex.id), 1)[0];
    removedVertex.clear()
    this.vertexMarkers.forEach((vertexMarker, index) => {
      vertexMarker.id = index.toString()
    })
    return removedVertex;
  }
  splitLine(sourceVertex: Vertex, destinationVertex: Vertex, position: L.LatLng) {
    const sourceId = Number(sourceVertex.id);
    const destinationId = Number(destinationVertex.id);
    console.log(sourceId);
    console.log(destinationId);
    console.log(this.vertexMarkers);
    if (sourceId == (this.vertexMarkers.length - 1) && destinationId == 0) {

      this.addVertex(position.lat, position.lng, this.vertexMarkers.length.toString());

    }
    else if (sourceId == Math.max(sourceId, destinationId)) {
      this.addVertex(position.lat, position.lng, sourceId.toString());
    } else {
      this.addVertex(position.lat, position.lng, destinationId.toString());
    }
    this.vertexMarkers.forEach((vertexMarker, index) => {
      vertexMarker.id = index.toString()
    })
  }

  renderTo(map: L.Map): void {
    this.clear()
    this.createLinks()
    this.links.forEach((link) => {
      link.setOnLinkClickFunction((link, event) => {
        this.splitLine(link.firstVertex, link.secondVertex, event.latlng)
        this.renderTo(map)
      })
      link.renderTo(map);
    });
    this.vertexMarkers.forEach((vertexMarker) => {
      vertexMarker.draggable = true
      vertexMarker.clickable = true
      vertexMarker.setClickDragBehaviour(
        (vertexMarker) => {
          this.removeVertex(vertexMarker)
          this.renderTo(map)
        },
      )
      vertexMarker.renderTo(map);
    });
  }
  clear(): void {
    this.links.forEach((link) => {
      link.clear();
    });
    this.vertexMarkers.forEach((vertexMarker) => {
      vertexMarker.clear();
    });
  }

  private createLinks() {
    this.resolveConnectionsByListOrder();
    this.links = [];

    for (const vertexMarker of this.vertexMarkers) {
      this.addLink(vertexMarker, this.vertexMarkers[(Number(vertexMarker.id) - 1)]);
      if (Number(vertexMarker.id) == this.vertexMarkers.length - 1) {
        this.addLink(vertexMarker, this.vertexMarkers[0]);
      }
    }
  }

  private resolveConnectionsByListOrder() {
    this.vertexMarkers.forEach((vertex) => {
      vertex.connections = [];
      if (vertex.id == '0') {
        vertex.connections.push(String(this.vertexMarkers.length - 1));
        vertex.connections.push(String(Number(vertex.id) + 1));
        return;
      }
      if (vertex.id == String(this.vertexMarkers.length - 1)) {
        vertex.connections.push(String(Number(vertex.id) - 1));
        vertex.connections.push('0');
        return;
      }
      vertex.connections.push(String(Number(vertex.id) - 1));
      vertex.connections.push(String(Number(vertex.id) + 1));
    });
  }

  private addLink(
    firstVertex: VertexMarker,
    secondVertex: VertexMarker,
    onLinkClickFunction?: (link: Link, clickEvent: L.LeafletMouseEvent) => void
  ) {
    if (!firstVertex || !secondVertex) {
      return;
    }
    const link: Link = new Link(firstVertex, secondVertex);
    if (this.renderClickLine) {
      link.setClickLineStyle({ color: this.clickLineColor, weight: 24, opacity: 0.2 });
    } else {
      link.setClickLineStyle({ color: this.clickLineColor, weight: 24, opacity: 0.0 });
    }
    link.setDrawLineStyle({ color: this.primaryLineColor, weight: 6, opacity: 0.8 });
    if (onLinkClickFunction) {
      link.setOnLinkClickFunction(onLinkClickFunction);
    }
    firstVertex.connectLink(link)
    secondVertex.connectLink(link)
    this.links.push(link);
  }

}

export { CreateArea };
