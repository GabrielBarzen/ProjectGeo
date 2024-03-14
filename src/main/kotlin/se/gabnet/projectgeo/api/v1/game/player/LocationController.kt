package se.gabnet.projectgeo.api.v1.game.player

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RestController
import se.gabnet.projectgeo.api.v1.game.endpoints.UserEndpoint

@RestController
@RequestMapping(UserEndpoint.USER_GAME_BASE.ENDPOINT)
class LocationController {

    @RequestMapping(
            UserEndpoint.LOCATION.ENDPOINT,
            method = [RequestMethod.POST],
            consumes = ["application/json"],
            produces = ["application/json"]
    )
    //TODO: Add user management so that the location gets updated for the logged in user, set from session cookie(spring security?)
    fun updateLocation(@RequestBody updateLocationRequest: updateLocationRequest): ResponseEntity<String> {
        print(updateLocationRequest)
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    data class updateLocationRequest(val y: Double, val x: Double)


}