package se.gabnet.projectgeo.model.game.placeable

import com.google.gson.annotations.Expose
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import java.util.*

@Entity
class Quality(
        @Expose @Id val id: UUID = UUID.randomUUID(),

        @Expose var name: String,
        @Expose var probability: Double,


        @Expose
        @JoinColumn
        @ManyToOne
        var material: Material

)
