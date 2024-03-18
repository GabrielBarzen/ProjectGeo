package se.gabnet.projectgeo.model.game.map.placeable.persistence

import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import se.gabnet.projectgeo.model.game.map.world.Area
import se.gabnet.projectgeo.model.game.map.world.Graph
import java.util.*

@Repository
interface AreaRepository : CrudRepository<Area, UUID> {
    override fun findById(id: UUID): Optional<Area>
    override fun findAll(): MutableIterable<Area>
}