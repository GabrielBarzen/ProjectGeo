package se.gabnet.projectgeo.api.v1.utils.inputvalidation

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import se.gabnet.projectgeo.model.game.map.Vertex
import se.gabnet.projectgeo.model.game.map.persistence.VertexRepository
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
        return vertexRepository.findById(parsedVertexId).getOrElse { throw AdminInputValidationException(VertexNotFoundResponse(vertexId)) }
    }


    open class ErrorResponse(
            val ERROR: String,
            val httpStatus: HttpStatus
    )

    class BadVertexIdResponse(resourceAreaId: String) :
            ErrorResponse("Error parsing resource area id (Malformed id: $resourceAreaId)", HttpStatus.BAD_REQUEST)


    class VertexNotFoundResponse(resourceAreaId: String) :
            ErrorResponse("Resource area not found (id: $resourceAreaId)", HttpStatus.BAD_REQUEST)


    class AdminInputValidationException(val response: ErrorResponse) : Throwable()

}