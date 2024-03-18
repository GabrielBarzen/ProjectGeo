package se.gabnet.projectgeo.model.game.map.placeable.persistence

import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import se.gabnet.projectgeo.model.game.map.world.AreaDefinition
import se.gabnet.projectgeo.model.game.map.world.Graph
import java.util.*

@Repository
interface AreaDefinitionRepository : CrudRepository<AreaDefinition, UUID> {
    override fun findById(id: UUID): Optional<AreaDefinition>
    override fun findAll(): MutableIterable<AreaDefinition>
}