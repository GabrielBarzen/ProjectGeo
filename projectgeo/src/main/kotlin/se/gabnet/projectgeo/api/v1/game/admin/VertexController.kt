package se.gabnet.projectgeo.api.v1.game.admin

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.ResourceAreaInputHandler
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.VertexInputHandler
import se.gabnet.projectgeo.model.endpoints.AdminEndpoint
import se.gabnet.projectgeo.model.game.map.persistence.VertexRepository

@RestController
@RequestMapping(AdminEndpoint.ADMIN_GAME_BASE.ENDPOINT)
class VertexController {

    @Autowired
    lateinit var vertexRepository: VertexRepository

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
            vertexRepository.save(vertex)
            ResponseEntity(HttpStatus.OK)
        } catch (e: ResourceAreaInputHandler.AdminInputValidationException) {
            val response = e.response
            ResponseEntity(response.ERROR, response.httpStatus)
        }
    }

    data class UpdateVertexRequest(val y: Double, val x: Double)
}