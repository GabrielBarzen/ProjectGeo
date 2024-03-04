package se.gabnet.projectgeo.model.game.map.persistence

import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import se.gabnet.projectgeo.model.game.map.Graph
import java.util.*

@Repository
interface GraphRepository : CrudRepository<Graph, UUID> {
    override fun findById(id: UUID): Optional<Graph>
    override fun findAll(): MutableIterable<Graph>
}