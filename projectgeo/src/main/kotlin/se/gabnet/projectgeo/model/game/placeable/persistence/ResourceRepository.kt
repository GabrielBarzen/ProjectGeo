package se.gabnet.projectgeo.model.game.placeable.persistence

import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import se.gabnet.projectgeo.model.game.placeable.Resource
import java.util.*

@Repository
interface ResourceRepository : CrudRepository<Resource, UUID> {
    override fun findById(id: UUID): Optional<Resource>
    override fun findAll(): MutableIterable<Resource>
}