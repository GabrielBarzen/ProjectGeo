package se.gabnet.projectgeo.api.v1.game.admin

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.ResourceAreaInputHandler
import se.gabnet.projectgeo.model.endpoints.AdminEndpoint
import se.gabnet.projectgeo.model.game.map.ResourceArea
import se.gabnet.projectgeo.model.game.map.Vertex
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository

@RestController
@RequestMapping(AdminEndpoint.ADMIN_GAME_BASE.ENDPOINT)
class ResourceAreaController {
    @Autowired
    lateinit var resourceAreaRepository: ResourceAreaRepository
    var repositoryGson: Gson = GsonBuilder().excludeFieldsWithoutExposeAnnotation().create()
    var gson: Gson = GsonBuilder().create()


    @RequestMapping(
            AdminEndpoint.RESOURCE_AREA.ENDPOINT,
            method = [RequestMethod.POST],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun createArea(@RequestBody body: String): ResponseEntity<String> {

        val createRequest: CreateRequest = gson.fromJson(body, CreateRequest::class.java)
        val resourceArea = ResourceArea(createRequest.name)
        val graph = resourceArea.createNewGraph()

        var firstVertex: Vertex? = null;
        var previousVertex: Vertex? = null;
        for (point in createRequest.points) {
            val vertex = graph.addVertex(point[0], point[1])
            if (firstVertex == null) {
                firstVertex = vertex
                previousVertex = vertex
                continue
            }
            if (previousVertex != null) {
                graph.addVertexConnection(vertex, previousVertex)
                previousVertex = vertex
            }
            if (createRequest.points.last() == point) {
                graph.addVertexConnection(vertex, firstVertex)
            }
        }
        resourceAreaRepository.save(resourceArea)
        return ResponseEntity(repositoryGson.toJson(resourceArea), HttpStatus.OK)
    }

    @RequestMapping(
            AdminEndpoint.RESOURCE_AREA.ENDPOINT,
            method = [RequestMethod.GET],
    )
    fun getArea(@RequestParam(name = "resource-area-id", required = false) resourceAreaId: String?): ResponseEntity<String> {
        return if (!resourceAreaId.isNullOrEmpty()) {
            getAreaById(resourceAreaId)
        } else {
            getAllAreas()
        }

    }

    private fun getAllAreas(): ResponseEntity<String> {
        val resourceAreaInputHandler = ResourceAreaInputHandler(resourceAreaRepository);
        val resourceAreas: List<ResourceArea> = resourceAreaInputHandler.getAllResourceAreas()
        return ResponseEntity(repositoryGson.toJson(resourceAreas), HttpStatus.OK)
    }

    private fun getAreaById(resourceAreaId: String): ResponseEntity<String> {
        val resourceAreaInputHandler = ResourceAreaInputHandler(resourceAreaRepository);
        return try {
            val resourceArea = resourceAreaInputHandler.getResourceArea(resourceAreaId)
            ResponseEntity(repositoryGson.toJson(resourceArea), HttpStatus.OK)
        } catch (e: AdminInputValidationException) {
            val response = e.response
            ResponseEntity(response.ERROR, response.httpStatus)
        }
    }

    @RequestMapping(
            AdminEndpoint.RESOURCE_AREA.ENDPOINT,
            method = [RequestMethod.DELETE],
    )
    fun deleteArea(@RequestParam(name = "resource-area-id") resourceAreaId: String): ResponseEntity<String> {
        val resourceAreaInputHandler = ResourceAreaInputHandler(resourceAreaRepository);
        return try {
            val resourceArea = resourceAreaInputHandler.getResourceArea(resourceAreaId)
            resourceAreaRepository.deleteById(resourceArea.id)
            ResponseEntity(HttpStatus.OK)
        } catch (e: AdminInputValidationException) {
            val response = e.response
            ResponseEntity(response.ERROR, response.httpStatus)
        }
    }

    data class CreateRequest(val points: List<List<Double>>, val name: String)

}
