package se.gabnet.projectgeo.util

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

}
