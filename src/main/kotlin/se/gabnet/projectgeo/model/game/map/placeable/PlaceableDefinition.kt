package se.gabnet.projectgeo.model.game.map.placeable

import com.google.gson.annotations.Expose
import jakarta.persistence.Id
import java.util.*

class PlaceableDefinition {
    @Expose
    @Id
    val id: UUID = UUID.randomUUID()

}
