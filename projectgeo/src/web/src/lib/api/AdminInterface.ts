import type { Graph, Vertex } from "../mapping/Graphs"


export async function createArea(pointlist: number[][], name: string): Promise<Response> {
  var body: any = { points: pointlist, name: name }

  var data = await fetch("/api/v1/game/admin/resource-area", {
    body: JSON.stringify(body),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return data
}

export async function deleteArea(areaId: number): Promise<Response> {
  var data = await fetch("/api/v1/game/admin/resource-area?resource-area-id=" + areaId, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return data
}


export async function fetchAllAreas(): Promise<Response> {
  var data = await fetch("/api/v1/game/admin/resource-area", {
    method: "GET",
  })
  return data
}

export async function updateVertexPosition(vertex: Vertex): Promise<Response> {
  let url = `/api/v1/game/admin/vertex?vertex-id=${vertex.id}`
  var body: any = JSON.stringify({ y: vertex.y, x: vertex.x })
  var data = await fetch(url, {
    method: "PUT",
    body: body
  })
  return data
}



export async function splitGraphLine(graph: Graph, source: Vertex, destination: Vertex, y: number, x: number) {
  let url = `/api/v1/game/admin/graph?graph-id=${graph.id}`
  var body: any = JSON.stringify({
    sourceVertex: source.id,
    destinationVertex: destination.id,
    y: y,
    x: x
  })
  var data = await fetch(url, {
    method: "PUT",
    body: body
  })
  return data
}

