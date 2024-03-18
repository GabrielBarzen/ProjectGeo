package se.gabnet.projectgeo.model.game.map.world

import com.google.gson.annotations.Expose
import jakarta.persistence.Id
import se.gabnet.projectgeo.model.game.map.placeable.PlaceableDefinition
import java.util.*

class AreaDefinition {
    @Expose
    @Id
    val id: UUID = UUID.randomUUID()
    val placeableDefinitions : MutableList<PlaceableDefinition> = mutableListOf()

}