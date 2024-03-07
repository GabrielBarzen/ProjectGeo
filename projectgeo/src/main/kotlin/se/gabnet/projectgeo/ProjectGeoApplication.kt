package se.gabnet.projectgeo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration

@Configuration
@ComponentScan("se.gabnet.projectgeo.api.v1")
@SpringBootApplication
class ProjectGeoApplication

fun main(args: Array<String>) {
    runApplication<ProjectGeoApplication>(*args)


}
