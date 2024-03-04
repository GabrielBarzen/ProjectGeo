package se.gabnet.projectgeo.model.game.map

import com.google.gson.annotations.Expose
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Inheritance
import jakarta.persistence.InheritanceType
import java.util.*

@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
open class Area {
    @Expose
    @Id
    open var id: UUID = UUID.randomUUID()
}
