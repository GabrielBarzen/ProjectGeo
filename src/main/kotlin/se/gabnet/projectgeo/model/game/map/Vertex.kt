package se.gabnet.projectgeo.model.game.map

import com.google.gson.annotations.Expose
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import java.util.*

@Entity
class Vertex(
        @Expose var y: Double,
        @Expose var x: Double,
        @Expose val connections: MutableSet<UUID>,
        @ManyToOne
        @JoinColumn
        val graph: Graph
) {
    @Id
    @Expose
    var id: UUID = UUID.randomUUID()

    fun distanceFrom(vertex: Vertex): Double {
        return distanceFrom(vertex.y, vertex.x)
    }

    fun distanceFrom(y: Double, x: Double): Double {
        return Math.sqrt(Math.pow(this.y - y, 2.0) + Math.pow(this.x - x, 2.0))
    }

    fun addConnection(vertexConnections: Vertex) {
        connections.add(vertexConnections.id)
    }

}
