export interface Area {
  name: string
  graphs: Map<string, Graph>
  id: string
}

export interface Graph {
  vertices: Map<string, Vertex>
  centerY: number
  centerX: number
  id: string
}

export interface Vertex {
  y: number
  x: number
  connections: string[]
  id: string
}
