package se.gabnet.projectgeo.api.v1.admin.area

import se.gabnet.projectgeo.model.game.map.world.Area
import se.gabnet.projectgeo.model.game.map.world.Graph
import se.gabnet.projectgeo.model.game.map.world.Vertex
import se.gabnet.projectgeo.util.GsonUtil

class AreaManipulator {
    companion object {
        fun create(body: String) : Area {
            val createAreaData: AreaRequest.RequestArea = GsonUtil.gson.fromJson(body,AreaRequest.RequestArea::class.java)
            val createArea = Area()
            val initialGraph = createArea.createGraph()

            createArea.name = createAreaData.name
            val vertexMap : MutableMap<Int,Vertex> = mutableMapOf()
            for (graph in createAreaData.graphs) {
                resolveVertices(graph, vertexMap, initialGraph)
            }

            return createArea
        }

        private fun resolveVertices(
            graph: AreaRequest.RequestGraph,
            vertexMap: MutableMap<Int, Vertex>,
            initialGraph: Graph
        ) {
            for (vertex in graph.vertices) {
                val createId: Int = vertex.id.toInt()
                vertexMap[createId] = initialGraph.addVertex(vertex.lat, vertex.lng)
            }
            for (vertex in graph.vertices) {
                resolveConnections(vertex, vertexMap, initialGraph)
            }
        }

        private fun resolveConnections(
            vertex: AreaRequest.RequestVertex,
            vertexMap: MutableMap<Int, Vertex>,
            initialGraph: Graph
        ) {
            for (connection in vertex.connections) {
                val createId: Int = vertex.id.toInt()
                val sourceVertex = vertexMap[createId]
                val connectedId = connection.toInt()
                val destinationVertex = vertexMap[connectedId]
                if (sourceVertex != null && destinationVertex != null) {
                    initialGraph.addVertexConnection(sourceVertex, destinationVertex)
                }
            }
        }

    }

}
