package se.gabnet.projectgeo.api.v1.game.admin

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RestController
import se.gabnet.projectgeo.model.endpoints.AdminEndpoint
import se.gabnet.projectgeo.model.game.map.ResourceArea
import se.gabnet.projectgeo.model.game.map.Vertex
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository
import java.util.*

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
                vertex.addConnection(previousVertex)
                previousVertex = vertex
            }
            if (createRequest.points.last() == point) {
                vertex.addConnection(firstVertex)
            }
        }
        resourceAreaRepository.save(resourceArea)
        return ResponseEntity(repositoryGson.toJson(resourceArea), HttpStatus.OK)
    }

    @RequestMapping(
            AdminEndpoint.RESOURCE_AREA.ENDPOINT,
            method = [RequestMethod.DELETE],
            consumes = ["application/json"]
    )
    fun deleteArea(@RequestBody body: String): ResponseEntity<String> {
        val deleteRequest: DeleteRequest = gson.fromJson(body, DeleteRequest::class.java)
        val resourceArea = resourceAreaRepository.findById(deleteRequest.id)
        resourceAreaRepository.deleteById(resourceArea.get().id)

        return ResponseEntity(HttpStatus.OK)
    }

    data class CreateRequest(val points: List<List<Double>>, val name: String)
    data class DeleteRequest(val id: UUID)

}
