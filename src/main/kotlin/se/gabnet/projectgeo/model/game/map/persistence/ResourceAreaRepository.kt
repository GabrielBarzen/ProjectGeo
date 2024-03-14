package se.gabnet.projectgeo.model.game.map.persistence

import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import se.gabnet.projectgeo.model.game.map.ResourceArea
import java.util.*

@Repository
interface ResourceAreaRepository : CrudRepository<ResourceArea, UUID> {
    override fun findById(id: UUID): Optional<ResourceArea>
    override fun findAll(): MutableIterable<ResourceArea>
}