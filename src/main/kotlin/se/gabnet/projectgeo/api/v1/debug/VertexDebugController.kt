package se.gabnet.projectgeo.api.v1.debug

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonSyntaxException
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

class VertexDebugController {

    var repositoryGson: Gson = GsonBuilder().excludeFieldsWithoutExposeAnnotation().create();
    var callGson: Gson = Gson();


    @Autowired
    lateinit var graphRepository: GraphRepository

    @Autowired
    lateinit var resourceAreaRepository: ResourceAreaRepository


    data class CreateVertexRequest(val y: Double, val x: Double)

    @RequestMapping("/vertex", method = [RequestMethod.POST], produces = ["application/json"], consumes = ["application/json"])
    fun createVertex(@RequestParam(name = "graph-id") graphIdString: String, @RequestBody body: String): ResponseEntity<String> {
        val responseEntity: ResponseEntity<String> = try {
            val graphId = UUID.fromString(graphIdString)
            val graphOptional: Optional<Graph> = graphRepository.findById(graphId);
            if (graphOptional.isPresent) {
                val graph: Graph = graphOptional.get()
                try {
                    val request = callGson.fromJson(body, CreateVertexRequest::class.java)
                    val vertex = graph.addVertex(request.y, request.x)
                    resourceAreaRepository.save(graph.area as ResourceArea)
                    ResponseEntity(repositoryGson.toJson(vertex), HttpStatus.OK)
                } catch (e: JsonSyntaxException) {
                    ResponseEntity(HttpStatus.BAD_REQUEST)
                }
            } else {
                ResponseEntity(HttpStatus.NOT_FOUND)
            }
        } catch (e: IllegalArgumentException) {
            ResponseEntity(HttpStatus.BAD_REQUEST)
        }
        return responseEntity
    }

    @RequestMapping("/vertex", method = [RequestMethod.GET])
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

    @RequestMapping("/vertex", method = [RequestMethod.PUT],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun updateGraph(@RequestParam(name = "id") id: String, @RequestBody jsonBody: String): ResponseEntity<String> {
        return ResponseEntity(HttpStatus.METHOD_NOT_ALLOWED)
    }

    @RequestMapping(
            "/vertex",
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