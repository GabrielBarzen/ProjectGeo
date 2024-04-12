package se.gabnet.projectgeo.api.v1.admin.area


class AreaRequest {
    data class RequestArea(
        val id: String,
        val name: String,
        val graphs: List<RequestGraph>,
    )

    data class RequestGraph(
        val id: String,
        val vertices: List<RequestVertex>,
        val centerLat: Double,
        val centerLng: Double,
    )

    data class RequestVertex(
        val id: String,
        val lat: Double,
        val lng: Double,
        val connections: List<String>,
    )
}