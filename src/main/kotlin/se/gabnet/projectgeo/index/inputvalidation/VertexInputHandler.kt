package se.gabnet.projectgeo.index.inputvalidation

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import se.gabnet.projectgeo.index.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.index.inputvalidation.AdminInputValidationHandling.ErrorResponse
import se.gabnet.projectgeo.model.game.map.world.Vertex
import java.util.*
import kotlin.jvm.optionals.getOrElse


class VertexInputHandler(val vertexRepository: VertexRepository) {


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

    fun getAllVertices(): List<Vertex> {
        return vertexRepository.findAll().toList()
    }

    fun getVertex(vertexId: String): Vertex {
        val parsedVertexId: UUID = parseId(vertexId)
                ?: throw AdminInputValidationException(BadVertexIdResponse(vertexId))
        return vertexRepository.findById(parsedVertexId).getOrElse { throw AdminInputValidationException(
            VertexNotFoundResponse(vertexId)
        ) }
    }


    class BadVertexIdResponse(resourceAreaId: String) :
            ErrorResponse("Error parsing resource area id (Malformed id: $resourceAreaId)", HttpStatus.BAD_REQUEST)


    class VertexNotFoundResponse(resourceAreaId: String) :
            ErrorResponse("Resource area not found (id: $resourceAreaId)", HttpStatus.BAD_REQUEST)

    class TooFewVertices() :
            ErrorResponse("Graph cannot contain less than 3 vertices", HttpStatus.CONFLICT)


}