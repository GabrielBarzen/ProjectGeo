import L, { LatLng } from 'leaflet';
import type { Vertex } from './Graphs';
import type { Link } from './Link';
class VertexMarker extends L.Circle {
	dragged = false;

	vertexId: string;
	onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);
	assignedMap: L.Map | undefined;
	private _clickable = false;
	public get clickable() {
		return this._clickable;
	}
	public set clickable(value) {
		this._clickable = value;
	}
	private _draggable = false;
	public get draggable() {
		return this._draggable;
	}
	public set draggable(value) {
		this._draggable = value;
	}
	clickedFunction: ((vertex: VertexMarker) => void) | undefined;
	draggedFunction: ((vertex: VertexMarker) => void) | undefined;

	connectedLinks: Link[];

	constructor(vertex: Vertex, connectedLinks: Link[]) {
		super(new LatLng(vertex.y, vertex.x));
		this.vertexId = vertex.id;
		this.setRadius(25);

		this.connectedLinks = connectedLinks;
	}

	setClickDragBehaviour(
		onClickFunction?: (vertex: VertexMarker) => void,
		onDragFunction?: (vertex: VertexMarker) => void
	) {
		this.clickedFunction = onClickFunction;
		this.draggedFunction = onDragFunction;

		if (this.onMobile) {
			this.setClickDragBehaviourTouch();
			return;
		}

		if (!this._clickable && !this._draggable) {
			return;
		}
		this.on('click', (e) => {
			L.DomEvent.stop(e);
		});
		this.on('mousedown', (e) => {
			L.DomEvent.stop(e);
			this.assignedMap?.dragging.disable();
			this.setDragged(false);
			if (this._draggable) {
				this.assignedMap?.on('mousemove', (mapMouseMoveEvent) => {
					this.setDragged(true);
					this.setLatLng(mapMouseMoveEvent.latlng);
					this.updateLinkPosition();
				});
			}
			this.on('mouseup', () => {
				this.removeEventListener('mousedown');
				this.removeEventListener('mousemove');
				this.removeEventListener('mouseup');
				this.assignedMap?.removeEventListener('mousemove');
				this.assignedMap?.dragging.enable();
				this.executeInteractFunction();
				this.dragged = false;
			});
		});
	}

	executeInteractFunction() {
		if (!this.dragged) {
			console.log('Clicked');
			if (this.clickedFunction) {
				this.clickedFunction(this);
			}
		} else {
			console.log('Dragged');
			if (this.draggedFunction) {
				this.draggedFunction(this);
			}
		}
		this.setClickDragBehaviour(this.clickedFunction, this.draggedFunction);
	}

	setClickDragBehaviourTouch() {
		alert('Touch interface not implemented');
	}

	updateLinkPosition() {
		this.connectedLinks.forEach((link) => {
			if (link.firstVertex.id == this.vertexId) {
				link.updatePosition(this.getLatLng());
			} else if (link.secondVertex.id == this.vertexId) {
				link.updatePosition(undefined, this.getLatLng());
			}
		});
	}

	getDragged() {
		return this.dragged;
	}
	setDragged(dragged: boolean) {
		this.dragged = dragged;
	}

	renderTo(map: L.Map) {
		this.assignedMap = map;
		map.addLayer(this);
	}

	clear() {
		if (this.assignedMap) {
			this.assignedMap!.removeLayer(this);
		}
	}
}

export { VertexMarker };
