package se.gabnet.projectgeo.model.game.placeable

import com.google.gson.annotations.Expose
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import se.gabnet.projectgeo.model.game.map.ResourceArea
import java.util.*

@Entity
class Resource(
        @Expose @Id val id: UUID = UUID.randomUUID(),
        @Expose var frequency: Double,

        @ManyToOne //TODO: many to many, have the same resource in multiple areas (similar forest have similar eco-system, resource area has several geological features)
        @JoinColumn
        val resourceArea: ResourceArea,

        @Expose
        @JoinColumn
        @ManyToOne
        var material: Material

)
