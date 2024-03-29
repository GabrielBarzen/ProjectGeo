package se.gabnet.projectgeo.index.inputvalidation

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import se.gabnet.projectgeo.index.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.index.inputvalidation.AdminInputValidationHandling.ErrorResponse
import se.gabnet.projectgeo.model.game.map.world.Graph
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
                ?: throw AdminInputValidationException(GraphNotFoundInResourceAreaResponse(resourceArea.id.toString(), graphId))
    }

    fun getGraph(graphId: String, graphRepository: GraphRepository): Graph {
        val parsedGraphId: UUID = parseId(graphId)
                ?: throw AdminInputValidationException(BadGraphIdResponse(graphId))
        return graphRepository.findById(parsedGraphId)
                .getOrElse { throw AdminInputValidationException(GraphNotFoundResponse(parsedGraphId.toString())) }
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


    class BadResourceAreaIdResponse(resourceAreaId: String) :
            ErrorResponse("Error parsing resource area id (Malformed id: $resourceAreaId)", HttpStatus.BAD_REQUEST)


    class ResourceAreaNotFoundResponse(resourceAreaId: String) :
            ErrorResponse("Resource area not found (id: $resourceAreaId)", HttpStatus.BAD_REQUEST)


    class BadGraphIdResponse(graphId: String) :
            ErrorResponse("Error parsing resource graph id (Malformed id: $graphId)", HttpStatus.BAD_REQUEST)

    class GraphNotFoundInResourceAreaResponse(resourceAreaId: String, graphId: String) :
            ErrorResponse("Graph area not found in resource area (graph-id: $graphId, resource-area-id: $resourceAreaId)", HttpStatus.BAD_REQUEST)

    class GraphNotFoundResponse(graphId: String) :
            ErrorResponse("Graph area not found in resource area (graph-id: $graphId)", HttpStatus.BAD_REQUEST)


}