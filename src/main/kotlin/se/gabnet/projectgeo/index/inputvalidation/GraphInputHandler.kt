package se.gabnet.projectgeo.index.inputvalidation

import org.springframework.http.HttpStatus
import se.gabnet.projectgeo.index.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.index.inputvalidation.AdminInputValidationHandling.ErrorResponse
import se.gabnet.projectgeo.model.game.map.placeable.persistence.GraphRepository
import se.gabnet.projectgeo.model.game.map.world.Graph
import java.util.*
import kotlin.jvm.optionals.getOrElse


class GraphInputHandler(val graphRepository: GraphRepository) {


    fun getGraph(graphId: String): Graph {
        val parsedGraphId: UUID = parseId(graphId)
                ?: throw AdminInputValidationException(BadGraphIdResponse(graphId))
        return getGraph(parsedGraphId)
    }

    fun getGraph(graphId: UUID): Graph {
        return graphRepository.findById(graphId)
            .getOrElse { throw AdminInputValidationException(GraphNotFoundResponse(graphId.toString())) }
    }


    fun parseId(id: String): UUID {
        return try {
            UUID.fromString(id);
        } catch (e: IllegalArgumentException) {
            throw AdminInputValidationException(BadGraphIdResponse(id))
        }
    }

    fun deleteGraph(id: String) {
        val parsedGraphId =  parseId(id)
        val graph  = getGraph(parsedGraphId)
        graphRepository.delete(graph)
    }

    fun getAllGraphs(): List<Graph> {
        return graphRepository.findAll().toList()
    }


    class BadGraphIdResponse(graphId: String) :
            ErrorResponse("Error parsing resource graph id (Malformed id: $graphId)", HttpStatus.BAD_REQUEST)

    class GraphNotFoundResponse(graphId: String) :
            ErrorResponse("Graph area not found  (graph-id: $graphId)", HttpStatus.BAD_REQUEST)


}