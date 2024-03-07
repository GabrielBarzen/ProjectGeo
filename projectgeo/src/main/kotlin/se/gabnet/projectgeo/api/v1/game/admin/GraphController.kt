package se.gabnet.projectgeo.api.v1.game.admin

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.ResourceAreaInputHandler
import se.gabnet.projectgeo.model.endpoints.AdminEndpoint
import se.gabnet.projectgeo.model.game.map.Graph
import se.gabnet.projectgeo.model.game.map.ResourceArea
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository
import se.gabnet.projectgeo.util.GsonUtil


@RestController
@RequestMapping(AdminEndpoint.ADMIN_GAME_BASE.ENDPOINT)
class GraphController {


    lateinit var resourceAreaRepository: ResourceAreaRepository

    @RequestMapping(
            AdminEndpoint.GRAPH.ENDPOINT,
            method = [RequestMethod.POST],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun createGraph(@RequestParam(name = "resource-area-id") resourceAreaId: String): ResponseEntity<String> {
        val resourceAreaInputHandler = ResourceAreaInputHandler(resourceAreaRepository);
        return try {

            val resourceArea: ResourceArea = resourceAreaInputHandler.getResourceArea(resourceAreaId)
            resourceArea.createNewGraph()
            resourceAreaRepository.save(resourceArea)
            ResponseEntity(GsonUtil.repositoryGson.toJson(resourceArea), HttpStatus.OK)
        } catch (graphInputValidationException: ResourceAreaInputHandler.AdminInputValidationException) {
            resourceAreaInputHandler.resolveErrorResponse(graphInputValidationException)
        }
    }

    @RequestMapping(
            AdminEndpoint.GRAPH.ENDPOINT,
            method = [RequestMethod.GET],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun readGraph(
            @RequestParam(name = "resource-area-id") resourceAreaId: String,
            @RequestParam(name = "graph-id", required = false) graphId: String
    ): ResponseEntity<String> {
        return if (graphId.isEmpty()) {
            ResponseEntity("", HttpStatus.NOT_IMPLEMENTED)
        } else {
            ResponseEntity("", HttpStatus.NOT_IMPLEMENTED)
        }
    }

    @RequestMapping(
            AdminEndpoint.GRAPH.ENDPOINT,
            method = [RequestMethod.PUT],
    )
    fun updateGraph(
            @RequestParam(name = "resource-area-id") resourceAreaId: String,
            @RequestParam(name = "graph-id") graphId: String
    ): ResponseEntity<String> {
        return ResponseEntity("{ MESSAGE : \"Update vertices directly ($)\" }", HttpStatus.METHOD_NOT_ALLOWED)
    }

    @RequestMapping(
            AdminEndpoint.GRAPH.ENDPOINT,
            method = [RequestMethod.DELETE],
            produces = ["application/json"],
    )
    fun deleteGraph(
            @RequestParam(name = "resource-area-id") resourceAreaId: String,
            @RequestParam(name = "graph-id") graphId: String
    ): ResponseEntity<String> {
        val resourceAreaInputHandler = ResourceAreaInputHandler(resourceAreaRepository);

        return try {
            val resourceAreaGraphPair = getResourceAreaGraphPair(resourceAreaId, graphId)
            val resourceArea = resourceAreaGraphPair.first
            val graph = resourceAreaGraphPair.second

            resourceArea.graphs.remove(graph.id)
            val savedResourceArea = resourceAreaRepository.save(resourceArea)
            ResponseEntity(GsonUtil.repositoryGson.toJson(savedResourceArea), HttpStatus.OK)
        } catch (graphInputValidationException: ResourceAreaInputHandler.AdminInputValidationException) {
            resourceAreaInputHandler.resolveErrorResponse(graphInputValidationException)
        }
    }

    private fun getResourceAreaGraphPair(resourceAreaId: String, graphId: String): Pair<ResourceArea, Graph> {
        val resourceAreaInputHandler = ResourceAreaInputHandler(resourceAreaRepository);

        val resourceArea: ResourceArea = resourceAreaInputHandler.getResourceArea(resourceAreaId)
        val graph: Graph = resourceAreaInputHandler.getGraph(graphId, resourceArea)
        return Pair(resourceArea, graph)
    }

}



