package se.gabnet.projectgeo.model.game.placeable

import com.google.gson.annotations.Expose
import jakarta.persistence.*
import java.util.*

@Entity
class Material(


        @OneToMany(orphanRemoval = true, cascade = [CascadeType.ALL], fetch = FetchType.LAZY) //TODO: Many to many, share material between resources (ex. Graphite, clay, birch, oak, beech)
        var resources: MutableList<Resource>,

        @Expose var name: String,

        @OneToMany(orphanRemoval = true, cascade = [CascadeType.ALL], fetch = FetchType.LAZY) //TODO: Many to many, share yield between resources (ex. frequent, common, infrequent, rare)
        var yield: MutableList<Yield>,

        ) {
    @Expose
    @Id
    val id: UUID = UUID.randomUUID()

}