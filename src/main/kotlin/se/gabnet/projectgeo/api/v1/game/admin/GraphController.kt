package se.gabnet.projectgeo.api.v1.game.admin

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import se.gabnet.projectgeo.api.v1.game.endpoints.AdminEndpoint
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.GraphInputHandler
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.ResourceAreaInputHandler
import se.gabnet.projectgeo.model.game.map.Graph
import se.gabnet.projectgeo.model.game.map.ResourceArea
import se.gabnet.projectgeo.model.game.map.persistence.GraphRepository
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository
import se.gabnet.projectgeo.util.GsonUtil
import java.util.*


@RestController
@RequestMapping(AdminEndpoint.ADMIN_GAME_BASE.ENDPOINT)
class GraphController {

    @Autowired
    lateinit var resourceAreaRepository: ResourceAreaRepository

    @Autowired
    lateinit var graphRepository: GraphRepository

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
        } catch (graphInputValidationException: AdminInputValidationException) {
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
        } catch (graphInputValidationException: AdminInputValidationException) {
            resourceAreaInputHandler.resolveErrorResponse(graphInputValidationException)
        }
    }

    private fun getResourceAreaGraphPair(resourceAreaId: String, graphId: String): Pair<ResourceArea, Graph> {
        val resourceAreaInputHandler = ResourceAreaInputHandler(resourceAreaRepository);

        val resourceArea: ResourceArea = resourceAreaInputHandler.getResourceArea(resourceAreaId)
        val graph: Graph = resourceAreaInputHandler.getGraph(graphId, resourceArea)
        return Pair(resourceArea, graph)
    }

    @RequestMapping(
            AdminEndpoint.GRAPH.ENDPOINT,
            method = [RequestMethod.PUT],
    )
    fun updateGraph(
            @RequestParam(name = "graph-id") graphId: String,
            @RequestBody body: String
    ): ResponseEntity<String> {
        val updateGraphRequest = GsonUtil.gson.fromJson(body, UpdateGraphRequest::class.java)
        val resourceAreaInputHandler = ResourceAreaInputHandler(resourceAreaRepository);
        val graph = resourceAreaInputHandler.getGraph(graphId, graphRepository)
        val sourceVertex = graph.vertices[UUID.fromString(updateGraphRequest.sourceVertex)]
        val destinationVertex = graph.vertices[UUID.fromString(updateGraphRequest.destinationVertex)]
        graph.removeVertexConnection(sourceVertex!!, destinationVertex!!)
        val insertedVetex = graph.addVertex(updateGraphRequest.y!!, updateGraphRequest.x!!)
        graph.addVertexConnection(sourceVertex, insertedVetex)
        graph.addVertexConnection(insertedVetex, destinationVertex)
        graphRepository.save(graph)
        return ResponseEntity(HttpStatus.OK)
    }

    @RequestMapping(
            AdminEndpoint.GRAPH.ENDPOINT + "/parent",
            method = [RequestMethod.GET],
            produces = ["application/json"]
    )
    fun getParentFor(
            @RequestParam(name = "graph-id") graphId: String,
    ): ResponseEntity<String> {
        val graphInputHandler = GraphInputHandler(graphRepository)
        return try {
            val graph = graphInputHandler.getGraph(graphId)
            ResponseEntity(GsonUtil.gson.toJson(graph.area.id), HttpStatus.OK)

        } catch (e: AdminInputValidationException) {
            val response = e.response
            ResponseEntity(response.ERROR, response.httpStatus)
        }
    }

    data class UpdateGraphRequest(val sourceVertex: String?, val destinationVertex: String?, val y: Double?, val x: Double?)

}



