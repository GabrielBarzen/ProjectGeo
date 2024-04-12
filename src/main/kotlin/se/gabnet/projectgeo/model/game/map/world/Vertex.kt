package se.gabnet.projectgeo.model.game.map.world

import com.google.gson.annotations.Expose
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import org.hibernate.annotations.JdbcType
import org.hibernate.annotations.JdbcTypeCode
import java.util.*
import kotlin.math.pow
import kotlin.math.sqrt

@Entity
class Vertex(
        @Expose @Column var y: Double,
        @Expose @Column var x: Double,
        @ManyToOne
        @JoinColumn
        val graph: Graph,
        @Id
        @Column
        @Expose
        var id: UUID = UUID.randomUUID()
) {

    @Column
    @Expose
    val connections: MutableSet<UUID> = mutableSetOf()

    fun distanceFrom(vertex: Vertex): Double {
        return distanceFrom(vertex.y, vertex.x)
    }

    fun distanceFrom(y: Double, x: Double): Double {
        return sqrt((this.y - y).pow(2.0) + (this.x - x).pow(2.0))
    }

    fun addConnection(vertexConnections: Vertex) {
        connections.add(vertexConnections.id)
    }

}
