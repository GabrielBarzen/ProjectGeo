
export function getDistanceInKm(fromYX: number[], toYX: number[]) {
  var R = 6371 // Radius of the earth in km
  var dLat = deg2rad(fromYX[0] - toYX[0]) // deg2rad below
  var dLon = deg2rad(fromYX[1] - toYX[1])
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(toYX[0])) *
    Math.cos(deg2rad(fromYX[0])) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  var d = R * c // Distance in km
  return d
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}
