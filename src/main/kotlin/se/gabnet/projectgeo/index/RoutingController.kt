package se.gabnet.projectgeo.index

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping


@Controller
class RoutingController {
    @RequestMapping(value = ["/{path:[^\\.]*}"])
    fun redirect(): String {
        return "forward:/"
    }
}