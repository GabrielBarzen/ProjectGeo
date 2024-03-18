package se.gabnet.projectgeo.api.v1.datahandler

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity


open class DataValidationThrowableDefinition() {

    class AdminInputValidationHandling {
        open class ErrorResponse(
            val ERROR: String,
            val httpStatus: HttpStatus
        )

        class AdminInputValidationException(val response: ErrorResponse) : Throwable() {
            fun getResponseEntity(): ResponseEntity<String> {
                return ResponseEntity(response.ERROR,response.httpStatus)
            }
        }
    }


}