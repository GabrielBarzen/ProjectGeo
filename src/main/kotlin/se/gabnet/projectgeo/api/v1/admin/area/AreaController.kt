package se.gabnet.projectgeo.api.v1.admin.area

import org.apache.coyote.Request
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import se.gabnet.projectgeo.api.v0.game.endpoints.AdminEndpoint
import se.gabnet.projectgeo.model.game.map.placeable.persistence.AreaRepository
import se.gabnet.projectgeo.model.game.map.world.Area
import se.gabnet.projectgeo.util.GsonUtil

@RestController
@RequestMapping(AdminEndpoint.ADMIN_GAME_BASE.ENDPOINT)
class AreaController {

    @Autowired
    lateinit var  areaRepository: AreaRepository
    @RequestMapping(AdminEndpoint.AREA.ENDPOINT, method = [RequestMethod.POST])
    fun create(@RequestBody body: String) : ResponseEntity<String>{
        val area : Area = AreaManipulator.create(body)
        areaRepository.save(area)
        return ResponseEntity( GsonUtil.repositoryGson.toJson(area),HttpStatus.OK )
    }

    @RequestMapping(AdminEndpoint.AREA.ENDPOINT, method = [RequestMethod.GET])
    fun read(@RequestParam(required = false) id: String?) : ResponseEntity<String>{
        return if (id.isNullOrEmpty()) {
            var areas = areaRepository.findAll()
            var requestAreas : MutableList<AreaRequest.RequestArea> = mutableListOf()
            for (area in areas) {
                var graphs = area.graphs.values.map { graph ->
                    AreaRequest.RequestGraph(
                        graph.id.toString(),
                        graph.vertices.values.map { vertex -> AreaRequest.RequestVertex(vertex.id.toString(),vertex.y,vertex.x,vertex.connections.map { it.toString() }) },
                        graph.centerY,
                        graph.centerX)
                }

                requestAreas.add(AreaRequest.RequestArea(
                    area.id.toString(),
                    area.name,
                    graphs))
            }

            ResponseEntity( GsonUtil.gson.toJson(requestAreas),HttpStatus.OK )
        } else {
            ResponseEntity( HttpStatus.NOT_IMPLEMENTED )
        }


    }

}