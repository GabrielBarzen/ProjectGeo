package se.gabnet.projectgeo.api.v0.game.endpoints

sealed class UserEndpoint {

    data object USER_GAME_BASE : UserEndpoint() {
        const val ENDPOINT = "/api/v1/game/user"
    }

    data object LOCATION : UserEndpoint() {
        const val ENDPOINT = "/location"
    }


}