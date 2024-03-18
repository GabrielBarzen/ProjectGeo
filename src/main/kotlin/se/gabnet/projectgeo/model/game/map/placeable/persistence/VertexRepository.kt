package se.gabnet.projectgeo.model.game.map.placeable.persistence

import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import se.gabnet.projectgeo.model.game.map.world.Vertex
import java.util.*

@Repository
interface VertexRepository : CrudRepository<Vertex, UUID> {
    override fun findById(id: UUID): Optional<Vertex>
    override fun findAll(): MutableIterable<Vertex>
}