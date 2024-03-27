import L, { LatLng } from 'leaflet';
import type { Vertex } from './Graphs';
import type { Link } from './Link';


class VertexMarker extends L.CircleMarker implements Vertex {
  connectLink(link: Link) {
    this.connectedLinks.push(link)
  }
  dragged = false;

  onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  assignedMap: L.Map | undefined;
  private _clickable = false;
  public get clickable() {
    return this._clickable;
  }
  public set clickable(value: boolean) {
    this.setClickDragBehaviour()
    this._clickable = value;
  }
  private _draggable = false;
  public get draggable() {
    return this._draggable;
  }
  public set draggable(value: boolean) {
    this.setClickDragBehaviour()
    this._draggable = value;
  }
  clickedFunction: ((vertex: VertexMarker) => void) | undefined;
  draggedFunction: ((vertex: VertexMarker) => void) | undefined;
  connectedLinks: Link[] = []



  constructor(vertex: Vertex) {
    super(new LatLng(vertex.lat, vertex.lng));

    this.lat = vertex.lat
    this.lng = vertex.lng
    this.connections = vertex.connections
    this.id = vertex.id
  }

  lat: number;
  lng: number;
  connections: string[];
  id: string;


  setClickDragBehaviour(
    onClickFunction?: (vertex: VertexMarker) => void,
    onDragFunction?: (vertex: VertexMarker) => void
  ) {
    if (onClickFunction) {
      this.clickedFunction = onClickFunction!;
    }
    if (onDragFunction) {
      this.draggedFunction = onDragFunction!;
    }
    if (!this._clickable && !this._draggable) {
      return;
    }
    if (this.onMobile) {
      this.setClickDragBehaviourTouch();
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

      if (this.clickedFunction) {
        this.clickedFunction(this);
      }
    } else {

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
      if (link.firstVertex.id == this.id) {
        link.updatePosition(this.getLatLng());
      } else if (link.secondVertex.id == this.id) {
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
