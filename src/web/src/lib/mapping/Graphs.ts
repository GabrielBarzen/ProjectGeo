export type Area = {
  graphs: Graph[];
  id: string;
  name: string;
}
export type Graph = {
  id: string;
  vertices: Vertex[];
  centerLat: number;
  centerLng: number;
}

export type Vertex = {
  lat: number;
  lng: number;
  connections: string[];
  id: string;
}
