package se.gabnet.projectgeo.model.game.map.placeable

import com.google.gson.annotations.Expose
import jakarta.persistence.Entity
import jakarta.persistence.Id
import org.hibernate.annotations.ColumnDefault
import java.util.UUID
@Entity
open class Placeable(
    @Expose
    @ColumnDefault(value = "0.0")
    open val y: Double,
    @Expose
    @ColumnDefault(value = "0.0")
    open val x: Double,
    @Expose
    @Id
    open var id: UUID = UUID.randomUUID()
) {

}