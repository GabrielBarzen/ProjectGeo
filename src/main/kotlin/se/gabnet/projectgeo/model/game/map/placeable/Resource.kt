package se.gabnet.projectgeo.model.game.map.placeable

import jakarta.persistence.Entity

@Entity
class Resource(override val y: Double, override val x : Double) : Placeable(y,x) {

}
