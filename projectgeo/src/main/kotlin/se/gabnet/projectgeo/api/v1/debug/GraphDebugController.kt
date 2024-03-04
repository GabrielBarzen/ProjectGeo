package se.gabnet.projectgeo.api.v1.debug

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import se.gabnet.projectgeo.model.game.map.Graph
import se.gabnet.projectgeo.model.game.map.ResourceArea
import se.gabnet.projectgeo.model.game.map.persistence.GraphRepository
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository
import java.util.*

@RestController
@RequestMapping("/api/v1/debug/game/")

class GraphDebugController {


    var repositoryGson: Gson = GsonBuilder().excludeFieldsWithoutExposeAnnotation().create();

    @Autowired
    lateinit var graphRepository: GraphRepository

    @Autowired
    lateinit var resourceAreaRepository: ResourceAreaRepository


    @RequestMapping("/graph", method = [RequestMethod.POST], produces = ["application/json"])
    fun createGraph(@RequestParam(name = "resource-area-id") resourceAreaIdString: String): ResponseEntity<String> {
        val responseEntity: ResponseEntity<String> = try {
            val resourceAreaId = UUID.fromString(resourceAreaIdString)
            val resourceAreaOptional: Optional<ResourceArea> = resourceAreaRepository.findById(resourceAreaId);
            if (resourceAreaOptional.isPresent) {
                val resourceArea = resourceAreaOptional.get()
                val graph = resourceArea.createNewGraph()
                resourceAreaRepository.save(resourceArea)
                ResponseEntity(repositoryGson.toJson(resourceArea), HttpStatus.OK)
            } else {
                ResponseEntity(HttpStatus.NOT_FOUND)
            }
        } catch (e: IllegalArgumentException) {
            ResponseEntity(HttpStatus.BAD_REQUEST)
        }
        return responseEntity
    }

    @RequestMapping("/graph", method = [RequestMethod.GET])
    fun getGraph(@RequestParam(name = "id") id: String): ResponseEntity<String> {
        val responseEntity: ResponseEntity<String> = try {
            val graphId = UUID.fromString(id)
            val graphOptional: Optional<Graph> = graphRepository.findById(graphId);
            if (graphOptional.isPresent) {
                ResponseEntity(repositoryGson.toJson(graphOptional.get()), HttpStatus.OK)
            } else {
                ResponseEntity(HttpStatus.NOT_FOUND)
            }
        } catch (e: IllegalArgumentException) {
            ResponseEntity(HttpStatus.BAD_REQUEST)
        }
        return responseEntity
    }

    @RequestMapping("/graph", method = [RequestMethod.PUT],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun updateGraph(@RequestParam(name = "id") id: String, @RequestBody jsonBody: String): ResponseEntity<String> {
        return ResponseEntity(HttpStatus.METHOD_NOT_ALLOWED)
    }

    @RequestMapping(
            "/graph",
            method = [RequestMethod.DELETE],
    )
    fun deleteGraph(@RequestParam(name = "id") resourceAreaIdString: String): ResponseEntity<String> {
        val responseEntity: ResponseEntity<String> = try {
            val graphId = UUID.fromString(resourceAreaIdString)
            val graphOptional: Optional<Graph> = graphRepository.findById(graphId);
            if (graphOptional.isPresent) {
                val graph = graphOptional.get()
                val resourceArea: ResourceArea = graph.area as ResourceArea
                if (resourceArea.removeGraph(graph) != null) {
                    resourceAreaRepository.save(resourceArea)
                    ResponseEntity(repositoryGson.toJson(resourceArea), HttpStatus.OK)
                } else ResponseEntity(HttpStatus.NOT_FOUND)
            } else ResponseEntity(HttpStatus.NOT_FOUND)

        } catch (e: IllegalArgumentException) {
            ResponseEntity(HttpStatus.BAD_REQUEST)
        }
        return responseEntity
    }
}