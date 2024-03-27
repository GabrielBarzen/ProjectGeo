import { type Vertex, type Area } from '../mapping/Graphs';
import { Link } from '../mapping/Link';
import L, { LatLng } from 'leaflet';
import { VertexMarker } from '../mapping/VertexMarker';

class MapArea {
  links: Map<string, [Vertex, Link[]]> = new Map();
  markers: Map<string, [Vertex, VertexMarker]> = new Map();

  primaryLineColor: string;
  debugLineColor: string;
  renderClickLine: boolean;
  area: Area;
  assignedMap: L.Map | undefined;
  textBox: L.Marker | undefined;

  constructor(
    graph: Area,
    primaryLineColor: string = '#555555',
    clickLineColor: string = '#111111',
    renderClickLine: boolean = false
  ) {
    this.primaryLineColor = primaryLineColor;
    this.debugLineColor = clickLineColor;
    this.renderClickLine = renderClickLine;
    this.area = graph;
  }

  createLinks() {
    const checkSet: Set<string> = new Set();
    this.links.clear();
    if (!this.area.vertices) {
      return;
    }

    for (const vertex of this.area.vertices.values()) {
      if (!vertex.connections) continue;
      for (const vertexId of vertex.connections) {
        const checkList = [vertexId, vertex.id].sort().toString();
        if (checkSet.has(checkList)) {
          continue;
        }
        checkSet.add(checkList);
        const connectedVertex: Vertex | undefined = this.area.vertices.get(vertexId);
        if (connectedVertex == undefined) {
          continue;
        }

        this.addLink(vertex, connectedVertex);
      }
    }
  }

  addLink(firstVertex: Vertex, secondVertex: Vertex) {
    if (!firstVertex || !secondVertex) {
      return;
    }
    const vertices = [firstVertex, secondVertex];
    const link: Link = new Link(vertices[0], vertices[1]);
    if (this.renderClickLine) {
      link.setClickLineStyle({ color: this.debugLineColor, weight: 24, opacity: 0.2 });
    } else {
      link.setClickLineStyle({ color: this.debugLineColor, weight: 24, opacity: 0.0 });
    }
    link.setDrawLineStyle({ color: this.primaryLineColor, weight: 6, opacity: 0.8 });

    const firstLinkEntry = this.links.get(firstVertex.id);
    const secondLinkEntry = this.links.get(secondVertex.id);

    if (!firstLinkEntry) {
      this.links.set(firstVertex.id, [firstVertex, [link]]);
    }
    if (!secondLinkEntry) {
      this.links.set(secondVertex.id, [secondVertex, [link]]);
    }
    if (!firstLinkEntry && !secondLinkEntry) return;

    const entries = [this.links.get(firstVertex.id), this.links.get(secondVertex.id)];

    entries.forEach((entry) => {
      if (!entry) {
        throw new Error('Vertex entry still undefined after setting');
      }

      if (!entry[1].includes(link)) {
        entry[1].push(link);
      }

      this.links.set(entry[0].id, [entry[0], entry[1]]);
    });
  }

  addMarkers(
    draggable: boolean,
    onVertexClickFunction?: (vertex: Vertex) => void,
    onVertexDragFunction?: (vertex: Vertex) => void
  ) {
    this.markers.clear();
    this.links.forEach((layerValue) => {
      const vertex = layerValue[0];
      const marker = new VertexMarker(this, vertex, [vertex.y, vertex.x], layerValue[1]);
      marker.setStyle({ weight: 4 });
      if (onVertexClickFunction && (onVertexDragFunction || !draggable)) {
        this.setVertexFunction(marker, onVertexClickFunction, onVertexDragFunction);
      }

      this.markers.set(vertex.id, [vertex, marker]);
    });
  }

  private setVertexFunction(
    marker: VertexMarker,
    onVertexClickFunction?: (vertex: Vertex) => void,
    onVertexDragFunction?: (vertex: Vertex) => void
  ) {
    marker.clickedFunction = onVertexClickFunction!;
    if (onVertexDragFunction) {
      marker.draggedFunction = onVertexDragFunction!;
    }
  }

  setOnLineClickFunction(
    onLineClickFunction: (graph: MapArea, pressedLink: [Vertex, Vertex], position: LatLng) => void
  ) {
    this.links.forEach((linkEntry) => {
      linkEntry[1].forEach((link) => {
        link.setOnClickFunction(onLineClickFunction);
      });
    });
  }

  renderTo(map: L.Map) {
    this.createLinks();
    this.assignedMap = map;

    if (this.assignedMap == undefined) {
      return;
    }
    const textIcon = L.divIcon({
      className: 'resource-area-graph-text',
      html: `<b>${'REPLACE WITH REAL NAME'}</b>`
    });
    this.textBox = L.marker([this.area.centerY, this.area.centerX], { icon: textIcon });
    this.textBox.addTo(map);

    this.links.forEach((layerValue) => {
      const linkEntry: Link[] = layerValue[1];
      linkEntry.forEach((link) => {
        link.clear();
        link.renderTo(this.assignedMap!);
      });
    });

    this.markers.forEach((layerValue) => {
      const marker: VertexMarker = layerValue[1];
      marker.renderTo(this.assignedMap!);
    });
  }

  clear() {
    this.links.forEach((layerValue) => {
      const linkEntry: Link[] = layerValue[1];
      linkEntry.forEach((link) => {
        link.clear();
      });
    });
    this.markers.forEach((layerValue) => {
      const marker: VertexMarker = layerValue[1];
      marker.clear();
    });

    if (this.textBox) {
      this.assignedMap?.removeLayer(this.textBox);
    }
  }
}

export { MapArea };