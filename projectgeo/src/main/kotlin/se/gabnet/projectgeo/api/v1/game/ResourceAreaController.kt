package se.gabnet.projectgeo.api.v1.game

import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/game")
class ResourceAreaController() {

    @RequestMapping(
            "/area",
            method = [RequestMethod.POST],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun createPolygon(): String {
        return "{\"NI\"=\"NI\"}"
    }

    @RequestMapping(
            "/area",
            method = [RequestMethod.PUT],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun updatePolygon(): String {
        return "{\"NI\"=\"NI\"}"
    }

    @RequestMapping(
            "/area",
            method = [RequestMethod.DELETE],

            )
    fun deletePolygon(): String {
        return "{\"NI\"=\"NI\"}"
    }

    @RequestMapping(
            "/area",
            method = [RequestMethod.GET],
            produces = ["application/json"],

            )
    fun getPolygon(): String {
        return "{\"NI\"=\"NI\"}"
    }
}
