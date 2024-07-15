import { type Area, type Graph } from '../mapping/Graphs';
import L from 'leaflet';
import { MapGraph } from './MapGraph';

class MapArea implements Area {
  setLineClickEvent(lineClickFunction: (areaId: string) => void) {
    this.mapGraph.setLineClickEvent(lineClickFunction(this.id));
  }
  renderMarkers: boolean = false;

  constructor(
    area: Area
  ) {
    this.graphs = Array.from(area.graphs);
    this.id = area.id;
    this.name = area.name;
  }
  id: string;
  name: string;
  private _graphs: Graph[] = [];
  private mapGraph: MapGraph[] = [];

  public get graphs(): Graph[] {
    return this.mapGraph.map(mapGraph => mapGraph.toGraph());
  }
  public set graphs(value: Graph[]) {
    this.mapGraph = value.map((graph) => {
      return new MapGraph(graph);
    });
  }

  renderTo(map: L.Map) {
    this.mapGraph.forEach(mapGraph => {
      mapGraph.renderMarkers = this.renderMarkers;
      mapGraph.setTitle(this.name);

      mapGraph.renderTo(map);
    });
  }

  clear() {
    this.mapGraph.forEach(mapGraph => {
      mapGraph.clear();
    });
  }
}

