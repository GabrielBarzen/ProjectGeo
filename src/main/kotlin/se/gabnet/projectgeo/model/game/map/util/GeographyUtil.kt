package se.gabnet.projectgeo.model.game.map.util

import se.gabnet.projectgeo.model.game.map.world.Vertex
import kotlin.math.acos
import kotlin.math.cos
import kotlin.math.sin

object GeographyUtil {

    fun coordinateAverage(coordinatesYX: List<Pair<Double, Double>>): Pair<Double, Double> {
        var centerY = 0.0
        var centerX = 0.0
        for (coordinate in coordinatesYX) {
            centerY += coordinate.first
            centerX += coordinate.second
        }
        centerY = (centerY / coordinatesYX.size)
        centerX = (centerX / coordinatesYX.size)
        return Pair(centerY, centerX)
    }
     fun distanceBetweenInKm(lat:Double, lon:Double, destination: Vertex): Double {
        return (distanceBetweenInKm(lat,lon,destination.y,destination.x))
    }
     fun distanceBetweenInKm(source: Vertex, destination: Vertex): Double {
        return (distanceBetweenInKm(source.y,source.x,destination.y,destination.x))
    }

     fun distanceBetweenInKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0.0
        } else {
            val theta = lon1 - lon2
            var dist = sin(Math.toRadians(lat1)) * sin(Math.toRadians(lat2)) + cos(Math.toRadians(lat1)) * cos(
                Math.toRadians(lat2)
            ) * cos(Math.toRadians(theta))
            dist = acos(dist)
            dist = Math.toDegrees(dist)
            dist *= 60 * 1.1515
            dist *= 1.609344
            return (dist)
        }
    }

}
