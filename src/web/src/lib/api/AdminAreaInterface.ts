import type { Area } from "$lib/mapping/Graphs";

const URL = "/api/v1/game/admin/area"


export async function CREATE(area: Area): Promise<Area> {
  const createUrl = `${URL}`
  const headers = { 'Content-type': 'application/json' }
  const method = "POST"
  const body = JSON.stringify(area)
  const data = await fetch(createUrl, {
    method: method,
    headers: headers,
    body: body
  })
  return parseArea(await data.json())
}
export async function READ(): Promise<Area[]> {
  const createUrl = `${URL}`
  const headers = { 'Accept': 'application/json' }
  const method = "GET"
  const data = await fetch(createUrl, {
    method: method,
    headers: headers,
  })
  return parseAreas(await data.json())
}
export async function UPDATE(area: Area) {

  throw new Error("Function not implemented.");
}
export async function DELETE(area: Area) {
  const createUrl = `${URL}`
  const headers = { 'Accept': 'application/json' }
  const method = "DELETE"
  const body = JSON.stringify(area)
  const data = await fetch(createUrl, {
    method: method,
    headers: headers,
    body: body
  })
}

function parseArea(data: Area): Area {
  return data as Area
}
function parseAreas(data: Area[]): Area[] {
  console.log(data)
  const areas: Area[] = data as Area[]
  return areas
}

