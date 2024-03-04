import L, { type LatLngExpression } from "leaflet"
class Link extends L.Polyline {
  first: number[]
  second: number[]
  firstId: string
  secondId: string
  constructor(firstYX: number[], secondYX: number[], firstId: string, secondId: string) {
    super([
      firstYX as LatLngExpression,
      secondYX as LatLngExpression,
    ])
    this.first = secondYX
    this.second = firstYX
    this.firstId = firstId
    this.secondId = secondId
  }
}
export { Link }
