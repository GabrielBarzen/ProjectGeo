package se.gabnet.projectgeo.api.v0.game.admin

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import se.gabnet.projectgeo.api.v0.game.endpoints.AdminEndpoint
import se.gabnet.projectgeo.api.v1.datahandler.DataValidationThrowableDefinition
import se.gabnet.projectgeo.index.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.index.inputvalidation.GraphInputHandler
import se.gabnet.projectgeo.index.inputvalidation.ResourceAreaInputHandler
import se.gabnet.projectgeo.model.game.map.world.Graph
import se.gabnet.projectgeo.model.game.map.placeable.persistence.GraphRepository
import se.gabnet.projectgeo.util.GsonUtil
import java.util.*


@RestController
@RequestMapping(AdminEndpoint.ADMIN_GAME_BASE.ENDPOINT)
class GraphController {



    @Autowired
    lateinit var graphRepository: GraphRepository

    @RequestMapping(
        AdminEndpoint.GRAPH.ENDPOINT,
        method = [RequestMethod.POST],
        produces = ["application/json"],
        consumes = ["application/json"]
    )
    fun createGraph(): ResponseEntity<String> {
        return ResponseEntity( "{ \"message\":\"Use area endpoint to create new graph\" }",HttpStatus.METHOD_NOT_ALLOWED)
    }

    @RequestMapping(
        AdminEndpoint.GRAPH.ENDPOINT,
        method = [RequestMethod.GET],
        produces = ["application/json"],
        consumes = ["application/json"]
    )
    fun readGraph(
        @RequestParam(name = "graph-id", required = false) graphId: String?
    ): ResponseEntity<String> {
        val graphInputHandler = GraphInputHandler(graphRepository)
        return try {
            if (graphId != null) {
                val graph = graphInputHandler.getGraph(graphId)
                return ResponseEntity(GsonUtil.repositoryGson.toJson(graph),HttpStatus.OK)
            }
            val graphs = graphInputHandler.getAllGraphs()
            ResponseEntity(GsonUtil.repositoryGson.toJson(graphs),HttpStatus.OK)
        } catch (e : DataValidationThrowableDefinition.AdminInputValidationHandling.AdminInputValidationException) {
            e.getResponseEntity()
        }
    }


    @RequestMapping(
        AdminEndpoint.GRAPH.ENDPOINT,
        method = [RequestMethod.DELETE],
        produces = ["application/json"],
    )
    fun deleteGraph(
        @RequestParam(name = "graph-id") graphId: String
    ): ResponseEntity<String> {
        val graphInputHandler = GraphInputHandler(graphRepository)
        return try {
            val graph = graphInputHandler.deleteGraph(graphId)
            ResponseEntity(HttpStatus.OK)
        } catch (e : DataValidationThrowableDefinition.AdminInputValidationHandling.AdminInputValidationException) {
            e.getResponseEntity()
        }
    }


    @RequestMapping(
        AdminEndpoint.GRAPH.ENDPOINT,
        method = [RequestMethod.PUT],
    )
    fun updateGraph(
        @RequestParam(name = "graph-id") graphId: String,
        @RequestBody body: String
    ): ResponseEntity<String> {
        var graphInputHandler = GraphInputHandler(graphRepository)
        return try {
            ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
        } catch (e : DataValidationThrowableDefinition.AdminInputValidationHandling.AdminInputValidationException) {
            e.getResponseEntity()
        }
    }
}



