package se.gabnet.projectgeo.model.game.map

import com.google.gson.annotations.Expose
import jakarta.persistence.*
import se.gabnet.projectgeo.model.game.placeable.Resource
import java.util.*

@Entity
class ResourceArea(

        @Expose
        var name: String,

        @Expose
        @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, cascade = [CascadeType.ALL])
        @MapKey(name = "id")
        var graphs: MutableMap<UUID, Graph> = mutableMapOf(),

        @Expose
        @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, mappedBy = "resourceArea", cascade = [CascadeType.ALL])
        @MapKey(name = "id")
        var resources: MutableMap<UUID, Resource> = mutableMapOf()
) : Area() {

    fun createNewGraph(): Graph {
        val newGraph = Graph(this)
        graphs[newGraph.id] = newGraph
        return newGraph
    }

    fun removeGraph(graph: Graph): Graph? {
        return graphs.remove(graph.id)
    }
}