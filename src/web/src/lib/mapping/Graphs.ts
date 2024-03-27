export type Area = {
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
