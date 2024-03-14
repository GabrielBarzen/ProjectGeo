package se.gabnet.projectgeo.api.v1.debug;

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import se.gabnet.projectgeo.model.game.map.ResourceArea
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository
import java.util.*


@RestController
@RequestMapping("/api/v1/debug/game/")
public class ResourceAreaDebugController {
    var repositoryGson: Gson = GsonBuilder().excludeFieldsWithoutExposeAnnotation().create()

    @Autowired
    lateinit var resourceAreaRepository: ResourceAreaRepository

    @RequestMapping("/resource-area", method = [RequestMethod.POST], produces = ["application/json"])
    fun createArea(): ResponseEntity<String> {
        val resourceArea: ResourceArea = ResourceArea("", mutableMapOf(), mutableMapOf());
        resourceAreaRepository.save(resourceArea)
        return ResponseEntity(repositoryGson.toJson(resourceArea), HttpStatus.OK)
    }

    @RequestMapping("/resource-area", method = [RequestMethod.GET])
    fun getArea(@RequestParam(name = "id", defaultValue = "") id: String): ResponseEntity<String> {
        val responseEntity: ResponseEntity<String> = if (id.isEmpty()) {
            getAllAreas()
        } else {
            try {
                val resourceAreaId = UUID.fromString(id)
                val resourceAreaOptional: Optional<ResourceArea> = resourceAreaRepository.findById(resourceAreaId);
                if (resourceAreaOptional.isPresent) {
                    ResponseEntity(repositoryGson.toJson(resourceAreaOptional.get()), HttpStatus.OK)
                } else {
                    ResponseEntity(HttpStatus.NOT_FOUND)
                }
            } catch (e: IllegalArgumentException) {
                ResponseEntity(HttpStatus.BAD_REQUEST)
            }
        }
        return responseEntity
    }

    fun getAllAreas(): ResponseEntity<String> {
        val responseEntity: ResponseEntity<String> = try {
            val resourceAreaIterable: MutableIterable<ResourceArea> = resourceAreaRepository.findAll()
            val resourceAreaList = resourceAreaIterable.iterator().asSequence().toList()
            if (resourceAreaList.isNotEmpty()) {
                ResponseEntity(repositoryGson.toJson(resourceAreaList), HttpStatus.OK)
            } else {
                ResponseEntity(HttpStatus.NOT_FOUND)
            }
        } catch (e: IllegalArgumentException) {
            ResponseEntity(HttpStatus.BAD_REQUEST)
        }
        return responseEntity
    }

    @RequestMapping("/resource-area", method = [RequestMethod.PUT],
            produces = ["application/json"],
            consumes = ["application/json"]
    )
    fun updateArea(@RequestParam(name = "id") id: String, @RequestBody jsonBody: String): ResponseEntity<String> {
        return ResponseEntity(HttpStatus.METHOD_NOT_ALLOWED)
    }

    @RequestMapping(
            "/resource-area",
            method = [RequestMethod.DELETE],
    )
    fun deleteArea(@RequestParam(name = "id") id: String): ResponseEntity<String> {
        val responseEntity: ResponseEntity<String> = try {
            val resourceAreaId = UUID.fromString(id)
            val resourceAreaOptional: Optional<ResourceArea> = resourceAreaRepository.findById(resourceAreaId);
            if (resourceAreaOptional.isPresent) {
                resourceAreaRepository.delete(resourceAreaOptional.get())
                ResponseEntity(HttpStatus.OK)
            } else {
                ResponseEntity(HttpStatus.NOT_FOUND)
            }
        } catch (e: IllegalArgumentException) {
            ResponseEntity(HttpStatus.BAD_REQUEST)
        }
        return responseEntity
    }

}
