package se.gabnet.projectgeo.api.v1.game.admin

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import se.gabnet.projectgeo.api.v1.game.endpoints.AdminEndpoint
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.VertexInputHandler
import se.gabnet.projectgeo.model.game.map.persistence.GraphRepository
import se.gabnet.projectgeo.model.game.map.persistence.VertexRepository

@RestController
@RequestMapping(AdminEndpoint.ADMIN_GAME_BASE.ENDPOINT)
class VertexController {

    @Autowired
    lateinit var vertexRepository: VertexRepository


    @Autowired
    lateinit var graphRepository: GraphRepository

    var repositoryGson: Gson = GsonBuilder().excludeFieldsWithoutExposeAnnotation().create()
    var gson: Gson = GsonBuilder().create()

    @RequestMapping(
            AdminEndpoint.VERTEX.ENDPOINT,
            method = [RequestMethod.PUT],
    )
    fun updateVertex(@RequestParam(name = "vertex-id") vertexId: String, @RequestBody vertexUpdateBody: String): ResponseEntity<String> {
        val vertexInputHandler = VertexInputHandler(vertexRepository);
        return try {
            val vertex = vertexInputHandler.getVertex(vertexId)
            val updateVertexRequest = gson.fromJson(vertexUpdateBody, UpdateVertexRequest::class.java)
            vertex.y = updateVertexRequest.y
            vertex.x = updateVertexRequest.x
            val graph = vertex.graph;
            graph.updateDynamics()
            vertexRepository.save(vertex)
            ResponseEntity(HttpStatus.OK)
        } catch (e: AdminInputValidationException) {
            val response = e.response
            ResponseEntity(response.ERROR, response.httpStatus)
        }
    }

    @RequestMapping(
            AdminEndpoint.VERTEX.ENDPOINT,
            method = [RequestMethod.DELETE],
    )
    fun deleteVertex(@RequestParam(name = "vertex-id") vertexId: String): ResponseEntity<String> {
        val vertexInputHandler = VertexInputHandler(vertexRepository);
        return try {
            val vertex = vertexInputHandler.getVertex(vertexId)
            val graph = vertex.graph

            graph.removeVertex(vertex)
            graphRepository.save(graph)
            ResponseEntity(repositoryGson.toJson(graph), HttpStatus.OK)
        } catch (e: AdminInputValidationException) {
            val response = e.response
            ResponseEntity(response.ERROR, response.httpStatus)
        }
    }

    data class UpdateVertexRequest(val y: Double, val x: Double)
}