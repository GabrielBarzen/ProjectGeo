import L, { type LatLngExpression } from 'leaflet';

import type { VertexMarker } from './VertexMarker';
class Link {
	firstVertex: VertexMarker;
	secondVertex: VertexMarker;
	clickLine: L.Polyline;
	drawLine: L.Polyline;

	assignedMap: L.Map | undefined;
	debugIdentifier = Math.random() * 1000;
	drawLineStyle: L.PolylineOptions = { color: '#555555', weight: 24, opacity: 0.0 };
	clickLineStyle: L.PolylineOptions = { color: '#111111', weight: 6, opacity: 0.8 };

	onLinkClickFunction: ((link: Link, event: L.LeafletMouseEvent) => void) | undefined;

	constructor(firstVertex: VertexMarker, secondVertex: VertexMarker) {
		this.firstVertex = firstVertex;
		this.secondVertex = secondVertex;

		const firstPosition: LatLngExpression = firstVertex.getLatLng();
		const secondPosition: LatLngExpression = secondVertex.getLatLng();
		this.clickLine = L.polyline([firstPosition, secondPosition], this.clickLineStyle);
		this.drawLine = L.polyline([firstPosition, secondPosition], this.drawLineStyle);
	}

	updatePosition(firstPosition?: LatLngExpression, secondPosition?: LatLngExpression) {
		if (firstPosition && secondPosition) {
			this.clickLine.setLatLngs([firstPosition, secondPosition]);
			this.drawLine.setLatLngs([firstPosition, secondPosition]);
		} else if (secondPosition) {
			this.clickLine.setLatLngs([
				this.clickLine.getLatLngs().at(0) as LatLngExpression,
				secondPosition
			]);
			this.drawLine.setLatLngs([
				this.clickLine.getLatLngs().at(0) as LatLngExpression,
				secondPosition
			]);
		} else if (firstPosition) {
			this.clickLine.setLatLngs([
				firstPosition,
				this.clickLine.getLatLngs().at(1) as LatLngExpression
			]);
			this.drawLine.setLatLngs([
				firstPosition,
				this.clickLine.getLatLngs().at(1) as LatLngExpression
			]);
		}
	}

	setOnLinkClickFunction(onClickFunction: (link: Link, event: L.LeafletMouseEvent) => void) {
		this.onLinkClickFunction = onClickFunction;
		this.clickLine.on('click', (clickEvent) => {
			if (this.onLinkClickFunction) {
				this.onLinkClickFunction(this, clickEvent);
			}
		});
	}

	setDrawLineStyle(style: L.PolylineOptions) {
		this.drawLineStyle = style;
		this.drawLine.setStyle(style);
	}
	setClickLineStyle(style: L.PolylineOptions) {
		this.clickLineStyle = style;
		this.clickLine.setStyle(style);
	}

	renderTo(map?: L.Map) {
		this.assignedMap = map;
		this.assignedMap?.addLayer(this.drawLine);
		this.assignedMap?.addLayer(this.clickLine);
	}
	clear() {
		this.assignedMap?.removeLayer(this.drawLine);
		this.assignedMap?.removeLayer(this.clickLine);
	}
}
export { Link };
