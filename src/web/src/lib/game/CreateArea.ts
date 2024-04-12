import { type Area, type Graph } from '../mapping/Graphs';
import { Link } from '../mapping/Link';
import { CreateGraph } from './CreateGraph';

class CreateArea implements Area {

  links: Link[] = [];

  constructor(
    area?: Area,
    primaryLineColor: string = '#555555',
    clickLineColor: string = '#111111',
    renderClickLine: boolean = false
  ) {
    if (area) {
      this.id = area.id
      this.name = area.name
      this._graphs = area.graphs
    } else {
      this.id = "0"
      this.name = ""
      this._graphs =
        [
          {
            id: "0",
            vertices: [],
            centerLat: 0.0,
            centerLng: 0.0
          }
        ]

    }
    this.createGraph = new CreateGraph(this._graphs[0], primaryLineColor, clickLineColor, renderClickLine)
  }
  private _graphs: Graph[];
  public get graphs(): Graph[] {
    return [this.createGraph.toGraph()];
  }
  public set graphs(value: Graph[]) {
    value.forEach(graph => {
      this.createGraph.id = graph.id
      this.createGraph.vertices = graph.vertices
      this.createGraph.centerLat = graph.centerLat
      this.createGraph.centerLng = graph.centerLng
    })
    this._graphs = value;
  }
  createGraph: CreateGraph;

  public toArea(): Area {
    return <Area>({
      id: this.id,
      name: this.name,
      graphs: [this.createGraph.toGraph()]
    })
  }

  id: string;
  name: string;
}

export { CreateArea };
