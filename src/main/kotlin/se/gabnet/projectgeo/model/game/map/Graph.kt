package se.gabnet.projectgeo.model.game.map


import com.google.gson.annotations.Expose
import jakarta.persistence.*
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.AdminInputValidationHandling.AdminInputValidationException
import se.gabnet.projectgeo.api.v1.utils.inputvalidation.VertexInputHandler
import se.gabnet.projectgeo.util.GeographyUtil
import java.util.*


@Entity
class Graph(


        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "area_id")
        val area: Area,

        @OneToMany(orphanRemoval = true, mappedBy = "graph", cascade = [CascadeType.ALL])
        @MapKey(name = "id")
        @Expose
        var vertices: MutableMap<UUID, Vertex> = mutableMapOf()) {
    var centerY: Double = 0.0
    var centerX: Double = 0.0
    var maxY: Double = 0.0
    var maxX: Double = 0.0
    var minY: Double = 0.0
    var minX: Double = 0.0

    @Expose
    @Id
    val id: UUID = UUID.randomUUID()


    fun addVertex(y: Double, x: Double): Vertex {
        val vertex = Vertex(y, x, mutableSetOf(), this)

        if (vertices.isEmpty()) {
            vertices[vertex.id] = vertex
        }

        for (vertexCompare in vertices.values) {
            if (vertexCompare.distanceFrom(vertex) == 0.0) {
                return vertexCompare
            }
        }

        vertices[vertex.id] = vertex

        updateDynamics()
        return vertex
    }

    fun removeVertex(vertexToRemove: Vertex): Vertex? {
        if (this.vertices.size <= 3) {
            throw AdminInputValidationException(VertexInputHandler.TooFewVertices())
        }
        val neighbours: MutableSet<UUID> = mutableSetOf()
        for (connection in vertexToRemove.connections) {
            neighbours.add(connection)
        }

        for (neighbourId in neighbours) {
            val neighbour = vertices.get(neighbourId)
            if (neighbour != null) {
                this.removeVertexConnection(vertexToRemove, neighbour)
            }
        }

        for (sourceId in neighbours) {
            for (destinationId in neighbours) {
                if (sourceId == destinationId) continue
                val source = vertices[sourceId]
                val destination = vertices[destinationId]
                if (source != null && destination != null) {
                    this.addVertexConnection(source, destination)
                }
            }
        }

        updateDynamics();
        return vertices.remove(vertexToRemove.id)
    }

    private fun updateDynamics() {
        val exAverage = GeographyUtil.coordinateAverage(vertices.values.stream().map { item -> Pair(item.y, item.x) }.toList())
        centerY = exAverage.first
        centerX = exAverage.second
        relcalculateMinMax()

    }

    private fun relcalculateMinMax() {
        maxX = Double.MIN_VALUE
        maxY = Double.MIN_VALUE
        minX = Double.MAX_VALUE
        minY = Double.MAX_VALUE
        for (vertex in vertices.values) {
            if (vertex.x > maxX) {
                maxX = vertex.x
            }
            if (vertex.y > maxY) {
                maxY = vertex.y
            }
            if (vertex.x < minX) {
                minX = vertex.x
            }
            if (vertex.y < minY) {
                minY = vertex.y
            }
        }
    }

    fun addVertexConnection(
            sourceVertex: Vertex,
            destinationVertex: Vertex,
    ): Vertex? {
        return addVertexConnection(sourceVertex.id, destinationVertex.id, false)
    }

    fun addVertexConnection(
            sourceVertex: Vertex,
            destinationVertex: Vertex,
            directional: Boolean
    ): Vertex? {
        return addVertexConnection(sourceVertex.id, destinationVertex.id, directional)
    }

    fun addVertexConnection(
            sourceVertexUUID: UUID,
            destinationVertexUUID: UUID,
            directional: Boolean
    ): Vertex? {
        val fetchedSourceVertex: Vertex? = vertices[sourceVertexUUID]
        val fetchedDestinationVertex: Vertex? = vertices[destinationVertexUUID]
        if (fetchedSourceVertex == null) {
            return null
        }
        if (fetchedDestinationVertex == null) {
            return null
        }

        fetchedDestinationVertex.id.let { fetchedSourceVertex.connections.add(it) }
        vertices[sourceVertexUUID] = fetchedSourceVertex;

        if (directional) {
            return fetchedSourceVertex
        }

        fetchedSourceVertex.id.let { fetchedDestinationVertex.connections.add(it) }
        vertices[destinationVertexUUID] = fetchedDestinationVertex;

        return fetchedSourceVertex
    }


    fun removeVertexConnection(
            sourceVertex: Vertex,
            destinationVertex: Vertex,
    ) {
        removeVertexConnection(sourceVertex.id, destinationVertex.id, false)
    }

    fun removeVertexConnection(
            sourceVertex: Vertex,
            destinationVertex: Vertex,
            directionalDelete: Boolean
    ) {
        removeVertexConnection(sourceVertex.id, destinationVertex.id, directionalDelete)
    }

    fun removeVertexConnection(
            sourceVertexUUID: UUID,
            destinationVertexUUID: UUID,
            directionalDelete: Boolean
    ): Vertex? {
        val fetchedSourceVertex: Vertex? = vertices[sourceVertexUUID]
        val fetchedDestinationVertex: Vertex? = vertices[destinationVertexUUID]

        if (fetchedSourceVertex == null) {
            return null
        }

        if (fetchedDestinationVertex == null) {
            return null
        }

        fetchedSourceVertex.connections.remove(fetchedDestinationVertex.id)
        vertices[sourceVertexUUID] = fetchedSourceVertex;

        if (directionalDelete) {
            return fetchedSourceVertex
        }

        fetchedDestinationVertex.connections.remove(fetchedSourceVertex.id)
        vertices[destinationVertexUUID] = fetchedDestinationVertex;

        return fetchedSourceVertex

    }

    fun getVerticesSortedByDistanceFrom(y: Double, x: Double): List<Vertex> {
        val sortedVertices: MutableList<Vertex> = mutableListOf()
        sortedVertices.addAll(vertices.values)
        sortedVertices.sortedBy { vertex -> vertex.distanceFrom(y, x) }
        return sortedVertices
    }


}

