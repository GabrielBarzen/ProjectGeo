package se.gabnet.projectgeo.api.v1.game.endpoints

sealed class AdminEndpoint {

    data object ADMIN_GAME_BASE : AdminEndpoint() {
        const val ENDPOINT = "/api/v1/game/admin"
    }

    data object GRAPH : AdminEndpoint() {
        const val ENDPOINT = "/graph"
    }

    data object RESOURCE_AREA : AdminEndpoint() {
        const val ENDPOINT = "/resource-area"
    }

    data object VERTEX : AdminEndpoint() {
        const val ENDPOINT = "/vertex"
    }


}