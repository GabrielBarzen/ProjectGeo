import type { Area } from "$lib/mapping/Graphs";

const ULR = "/api/v1/game/admin/area/"


export async function CREATE(area: Area): Promise<Area> {
  const createUrl = `${URL}`
  const headers = new Headers()
  headers.append("Content-Type", "application/json")
  const method = "POST"
  const body = JSON.stringify(area)
  const data = await fetch(createUrl, {
    method: method,
    headers: headers,
    body: body
  })
  return await JSON.parse(await data.json())

}
export async function READ(area: Area) {

}
export async function UPDATE(area: Area) {

}
export async function DELETE(area: Area) {

}
