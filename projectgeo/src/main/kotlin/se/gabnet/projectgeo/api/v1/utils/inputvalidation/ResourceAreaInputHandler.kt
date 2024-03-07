package se.gabnet.projectgeo.api.v1.utils.inputvalidation

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import se.gabnet.projectgeo.model.game.map.Graph
import se.gabnet.projectgeo.model.game.map.ResourceArea
import se.gabnet.projectgeo.model.game.map.persistence.ResourceAreaRepository
import java.util.*
import kotlin.jvm.optionals.getOrElse


class ResourceAreaInputHandler(val resourceAreaRepository: ResourceAreaRepository) {

    fun getResourceArea(resourceAreaId: String): ResourceArea {
        val parsedResourceAreaId: UUID = parseId(resourceAreaId)
                ?: throw AdminInputValidationException(BadResourceAreaIdResponse(resourceAreaId))
        return resourceAreaRepository.findById(parsedResourceAreaId)
                .getOrElse { throw AdminInputValidationException(ResourceAreaNotFoundResponse(resourceAreaId)) }
    }

    fun getGraph(graphId: String, resourceArea: ResourceArea): Graph {
        val parsedGraphid: UUID = parseId(graphId)
                ?: throw AdminInputValidationException(BadGraphIdResponse(graphId))
        return resourceArea.graphs[parsedGraphid]
                ?: throw AdminInputValidationException(GraphNotFoundResponse(resourceArea.id.toString(), graphId))
    }

    fun parseId(id: String): UUID? {
        return try {
            UUID.fromString(id);
        } catch (e: IllegalArgumentException) {
            null
        }
    }

    fun resolveErrorResponse(graphInputValidationException: AdminInputValidationException): ResponseEntity<String> {
        val graphResponse = graphInputValidationException.response;
        return ResponseEntity(graphResponse.ERROR, graphResponse.httpStatus)
    }

    fun getAllResourceAreas(): List<ResourceArea> {
        return resourceAreaRepository.findAll().toList()
    }


    open class ErrorResponse(
            val ERROR: String,
            val httpStatus: HttpStatus
    )

    class BadResourceAreaIdResponse(resourceAreaId: String) :
            ErrorResponse("Error parsing resource area id (Malformed id: $resourceAreaId)", HttpStatus.BAD_REQUEST)


    class ResourceAreaNotFoundResponse(resourceAreaId: String) :
            ErrorResponse("Resource area not found (id: $resourceAreaId)", HttpStatus.BAD_REQUEST)


    class BadGraphIdResponse(graphId: String) :
            ErrorResponse("Error parsing resource graph id (Malformed id: $graphId)", HttpStatus.BAD_REQUEST)

    class GraphNotFoundResponse(resourceAreaId: String, graphId: String) :
            ErrorResponse("Graph area not found in resource area (graph-id: $graphId, resource-area-id: $resourceAreaId)", HttpStatus.BAD_REQUEST)


    class AdminInputValidationException(val response: ErrorResponse) : Throwable()

}