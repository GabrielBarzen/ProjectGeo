package se.gabnet.projectgeo.api.v1.utils.inputvalidation

import org.springframework.http.HttpStatus
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.AdminInputValidationHandling.ErrorResponse
import se.gabnet.projectgeo.model.game.map.Graph
import se.gabnet.projectgeo.model.game.map.persistence.GraphRepository
import java.util.*
import kotlin.jvm.optionals.getOrElse


class GraphInputHandler(val graphRepository: GraphRepository) {


    fun getGraph(graphId: String): Graph {
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


    class BadGraphIdResponse(graphId: String) :
            ErrorResponse("Error parsing resource graph id (Malformed id: $graphId)", HttpStatus.BAD_REQUEST)

    class GraphNotFoundResponse(graphId: String) :
            ErrorResponse("Graph area not found  (graph-id: $graphId)", HttpStatus.BAD_REQUEST)


}