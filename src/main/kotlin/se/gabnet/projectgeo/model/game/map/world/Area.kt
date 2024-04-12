package se.gabnet.projectgeo.model.game.map.world

import com.google.gson.annotations.Expose
import jakarta.persistence.*
import se.gabnet.projectgeo.model.game.map.placeable.Placeable
import java.util.*

@Entity
class Area(


    @Expose
    var name: String = "",
    @Expose
    @Id
    val id: UUID = UUID.randomUUID(),


    @OneToMany(orphanRemoval = true, mappedBy = "area", cascade = [CascadeType.ALL])
    @MapKey(name = "id")
    @Expose
    val graphs : MutableMap<UUID,Graph> = mutableMapOf()


) {

    fun createGraph() : Graph {
        var graph = Graph(this);
        graphs.put(graph.id,graph);
        return graph
    }


}