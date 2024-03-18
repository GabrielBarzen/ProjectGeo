package se.gabnet.projectgeo.api.v0.game.player

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RestController
import se.gabnet.projectgeo.api.v0.game.endpoints.UserEndpoint
import se.gabnet.projectgeo.model.game.map.world.Graph
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository
import se.gabnet.projectgeo.model.game.map.util.GeographyUtil
import se.gabnet.projectgeo.util.GsonUtil
import java.util.UUID

@RestController
@RequestMapping(UserEndpoint.USER_GAME_BASE.ENDPOINT)
class LocationController {

    @Autowired
    lateinit var vertexRepository: VertexRepository
    @Autowired
    lateinit var graphRepository: GraphRepository
    @Autowired
    lateinit var resourceAreaRepository: ResourceAreaRepository
    @RequestMapping(
            UserEndpoint.LOCATION.ENDPOINT,
            method = [RequestMethod.POST],
            consumes = ["application/json"],
            produces = ["application/json"]
    )
    //TODO: Add user management so that the location gets updated for the logged in user, set from session cookie(spring security?)
    fun updateLocation(@RequestBody updateLocationRequest: updateLocationRequest): ResponseEntity<String> {

        var visibleGraphs :MutableMap<UUID, MutableList<Graph>> = mutableMapOf()
        var graphs = graphRepository.findAll()
        for (graph in graphs) {
            var distance = GeographyUtil.distanceBetweenInKm(updateLocationRequest.y,updateLocationRequest.x,graph.centerY,graph.centerX)
            if (distance < graph.maxDistance + 1) {
                if (visibleGraphs.containsKey(graph.area.id)) {
                    var graphList = visibleGraphs.get(graph.area.id) ?: continue
                    visibleGraphs[graph.area.id]?.add(graph)
                } else {
                    visibleGraphs[graph.area.id] = mutableListOf(graph)
                }
            }
        }
        var visibleItems : List<ResourceArea> = visibleGraphs.map { entry ->
            val area = resourceAreaRepository.findById(entry.key).get()
            val map = entry.value.map { it.id to it }.toMap()
            area.graphs= HashMap(map)
            area
        }.toList()
        return ResponseEntity( GsonUtil.repositoryGson.toJson(visibleItems),HttpStatus.OK)
    }

    data class updateLocationRequest(val y: Double, val x: Double)


}