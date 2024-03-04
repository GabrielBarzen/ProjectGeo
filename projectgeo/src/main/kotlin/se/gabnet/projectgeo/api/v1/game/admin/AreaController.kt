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
import se.gabnet.projectgeo.model.game.map.ResourceArea
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository
import java.util.*

@RestController
@RequestMapping("/api/v1/game/admin")
class AreaController() {
    @Autowired
    lateinit var resourceAreaRepository: ResourceAreaRepository
    var repositoryGson: Gson = GsonBuilder().excludeFieldsWithoutExposeAnnotation().create()
    var gson: Gson = GsonBuilder().create()

    @RequestMapping(
            "/area",
            method = [RequestMethod.POST],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun createArea(@RequestBody body: String): ResponseEntity<String> {
        val createRequest: CreateRequest = gson.fromJson(body, CreateRequest::class.java)
        val resourceArea = ResourceArea(createRequest.name)
        val graph = resourceArea.createNewGraph()

        for (point in createRequest.points) {
            var vertex = graph.addVertex(point[0], point[1])
        }

        for (vertex in graph.vertices.values) {
            for (vertexConnections in graph.vertices.values) {
                if (vertex.id != vertexConnections.id) {
                    vertex.addConnection(vertexConnections)
                }
            }
        }

        resourceAreaRepository.save(resourceArea)

        return ResponseEntity(repositoryGson.toJson(resourceArea), HttpStatus.OK)
    }

    @RequestMapping(
            "/area",
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
