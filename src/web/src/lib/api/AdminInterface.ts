import type { Graph, Vertex } from "../mapping/Graphs"


const baseAdminUrl = "/api/v1/game/admin/"

export async function createArea(pointlist: number[][], name: string): Promise<Response> {
  const body = { points: pointlist, name: name }

  const data = await fetch(`${baseAdminUrl}resource-area`, {
    body: JSON.stringify(body),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return data
}

export async function deleteArea(areaId: string): Promise<Response> {
  const data = await fetch(`${baseAdminUrl}resource-area?resource-area-id=${areaId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return data
}


export async function fetchAllAreas(): Promise<Response> {
  const data = await fetch(`${baseAdminUrl}resource-area`, {
    method: "GET",
  })
  return data
}

export async function updateVertexPosition(vertex: Vertex): Promise<Response> {
  const url = `${baseAdminUrl}vertex?vertex-id=${vertex.id}`
  const body = JSON.stringify({ y: vertex.y, x: vertex.x })
  const data = await fetch(url, {
    method: "PUT",
    body: body
  })
  return data
}



export async function splitGraphLine(graph: Graph, source: Vertex, destination: Vertex, y: number, x: number) {
  const url = `${baseAdminUrl}graph?graph-id=${graph.id}`
  const body = JSON.stringify({
    sourceVertex: source.id,
    destinationVertex: destination.id,
    y: y,
    x: x
  })
  const data = await fetch(url, {
    method: "PUT",
    body: body
  })
  return data
}



export async function getGraphParentAreaId(graphId: string): Promise<Response> {
  const url = `${baseAdminUrl}graph/parent?graph-id=${graphId}`
  const data = await fetch(url, {
    method: "GET",
  })

  return data

}



export async function deleteVertex(id: string): Promise<Response> {
  const data = await fetch(`${baseAdminUrl}vertex?vertex-id=${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return data
}

