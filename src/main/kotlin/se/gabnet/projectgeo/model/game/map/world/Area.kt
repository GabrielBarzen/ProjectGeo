package se.gabnet.projectgeo.model.game.map.world

import com.google.gson.annotations.Expose
import jakarta.persistence.Entity
import jakarta.persistence.Id
import se.gabnet.projectgeo.model.game.map.placeable.Placeable
import java.util.*

@Entity
class Area(

    @Expose
    val areaDefinition : AreaDefinition = AreaDefinition(),
    @Expose
    val graph : Graph = Graph(),
    @Expose
    val placeables : MutableList<Placeable> = mutableListOf(),
    @Expose
    @Id
    open var id: UUID = UUID.randomUUID()

) {


}