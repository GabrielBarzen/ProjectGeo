package se.gabnet.projectgeo.api.v1.game

import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/game/admin")
class ActionController() {

    @RequestMapping("/health", method = [RequestMethod.GET], produces = ["application/json"])
    fun health(): String {
        return "{\"NI\"=\"NI\"}"
    }


}
