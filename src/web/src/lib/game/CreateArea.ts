import { Vertex, type Area } from '../mapping/Graphs';
import { Link } from '../mapping/Link';
import L, { LatLng } from 'leaflet';
import { VertexMarker } from '$lib/mapping/VertexMarker';
import { MapArea } from './MapArea';
import { AreaRenderer } from './AreaRenderer.ts';

class CreateArea extends AreaRenderer {
	vertices: Vertex[] = [];
	links: Link[] = [];
	vertexMarkers: VertexMarker[] = [];

	constructor(
		primaryLineColor: string = '#555555',
		clickLineColor: string = '#111111',
		renderClickLine: boolean = false
	) {
		super(primaryLineColor, clickLineColor, renderClickLine);
	}

	addVertex(lat: number, lng: number, position?: number): Vertex {
		const vertex = new Vertex(String(this.vertices.length), lat, lng);
		if (position) {
			this.vertices.push(vertex);
		} else {
			this.vertices.splice(position!, 0, vertex);
		}
		this.createLinks();
		return vertex;
	}
	removeVertex(vertex: Vertex): Vertex {
		const removedVertex = this.vertices.splice(Number(vertex.id), 1)[0];
		this.createLinks();
		return removedVertex;
	}
	splitLine(sourceVertex: Vertex, destinationVertex: Vertex, position: L.LatLng) {
		const sourceId = Number(sourceVertex.id);
		const destinationId = Number(destinationVertex.id);
		if (sourceId == Math.min(sourceId, destinationId)) {
			this.addVertex(position.lat, position.lng, sourceId);
		} else {
			this.addVertex(position.lat, position.lng, destinationId);
		}
	}

	renderTo(map: L.Map): void {
		this.links.forEach((link) => {
			link.renderTo(map);
		});
		this.vertexMarkers.forEach((vertexMarker) => {
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
		this.vertexMarkers = [];

		for (const vertex of this.vertices) {
			this.addLink(vertex, this.vertices[Number(vertex.id) - 1]);
			if (Number(vertex.id) == this.vertices.length - 1) {
				this.addLink(vertex, this.vertices[0]);
			}
		}
		for (const vertex of this.vertices) {
			this.addVertexMarker(vertex);
		}
	}

	private resolveConnectionsByListOrder() {
		this.vertices.forEach((vertex) => {
			vertex.connections = [];
			if (vertex.id == '0') {
				vertex.connections.push(String(this.vertices.length - 1));
				vertex.connections.push(String(Number(vertex.id) + 1));
				return;
			}
			if (vertex.id == String(this.vertices.length - 1)) {
				vertex.connections.push(String(Number(vertex.id) - 1));
				vertex.connections.push('0');
				return;
			}
			vertex.connections.push(String(Number(vertex.id) - 1));
			vertex.connections.push(String(Number(vertex.id) + 1));
		});
	}

	private addLink(
		firstVertex: Vertex,
		secondVertex: Vertex,
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
		this.links.push(link);
	}

	private addVertexMarker(
		vertex: Vertex,
		vertexOnClickFunction?: (vertexMarker: VertexMarker) => void,
		vertexOnDragFunction?: (vertexMarker: VertexMarker) => void
	) {
		const postLink = this.links.at(Number(vertex.id));
		const preLink = this.links.at((Number(vertex.id) - 1) % this.links.length);
		let vertexMarker: VertexMarker | undefined;
		if (!preLink && !postLink) {
			return;
		}
		// eslint-disable-next-line prefer-const
		vertexMarker = new VertexMarker(vertex, [preLink!, postLink!]);
		vertexMarker.clickable = true;
		vertexMarker.draggable = true;
		vertexMarker.setClickDragBehaviour(vertexOnClickFunction, vertexOnDragFunction);

		this.vertexMarkers.push(vertexMarker);
	}
	//
	// addMarkers(
	// 	draggable: boolean,
	// 	onVertexClickFunction?: (vertex: Vertex) => void,
	// 	onVertexDragFunction?: (vertex: Vertex) => void
	// ) {
	// 	this.markers.clear();
	// 	this.links.forEach((layerValue) => {
	// 		const vertex = layerValue[0];
	// 		const marker = new VertexMarker(this, vertex, [vertex.y, vertex.x], layerValue[1]);
	// 		marker.setStyle({ weight: 4 });
	// 		if (onVertexClickFunction && (onVertexDragFunction || !draggable)) {
	// 			this.setVertexFunction(marker, onVertexClickFunction, onVertexDragFunction);
	// 		}
	//
	// 		this.markers.set(vertex.id, [vertex, marker]);
	// 	});
	// }
	//
	// setOnLineClickFunction(
	// 	onLineClickFunction: (graph: MapArea, pressedLink: [Vertex, Vertex], position: LatLng) => void
	// ) {
	// 	this.links.forEach((linkEntry) => {
	// 		linkEntry[1].forEach((link) => {
	// 			link.setOnClickFunction(onLineClickFunction);
	// 		});
	// 	});
	// }
	//
	// renderTo(map: L.Map) {
	// 	this.createLinks();
	// 	this.assignedMap = map;
	//
	// 	if (this.assignedMap == undefined) {
	// 		return;
	// 	}
	// 	const textIcon = L.divIcon({
	// 		className: 'resource-area-graph-text',
	// 		html: `<b>${'REPLACE WITH REAL NAME'}</b>`
	// 	});
	// 	this.textBox = L.marker([this.area.centerY, this.area.centerX], { icon: textIcon });
	// 	this.textBox.addTo(map);
	//
	// 	this.links.forEach((layerValue) => {
	// 		const linkEntry: Link[] = layerValue[1];
	// 		linkEntry.forEach((link) => {
	// 			link.clear();
	// 			link.renderTo(this.assignedMap!);
	// 		});
	// 	});
	//
	// 	this.markers.forEach((layerValue) => {
	// 		const marker: VertexMarker = layerValue[1];
	// 		marker.renderTo(this.assignedMap!);
	// 	});
	// }
	//
	// clear() {
	// 	this.links.forEach((layerValue) => {
	// 		const linkEntry: Link[] = layerValue[1];
	// 		linkEntry.forEach((link) => {
	// 			link.clear();
	// 		});
	// 	});
	// 	this.markers.forEach((layerValue) => {
	// 		const marker: VertexMarker = layerValue[1];
	// 		marker.clear();
	// 	});
	//
	// 	if (this.textBox) {
	// 		this.assignedMap?.removeLayer(this.textBox);
	// 	}
	// }
}

export { CreateArea };
