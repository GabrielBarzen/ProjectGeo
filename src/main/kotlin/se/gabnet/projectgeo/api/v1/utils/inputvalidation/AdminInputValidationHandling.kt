package se.gabnet.projectgeo.api.v1.utils.inputvalidation

import org.springframework.http.HttpStatus

class AdminInputValidationHandling {
    open class ErrorResponse(
            val ERROR: String,
            val httpStatus: HttpStatus
    )

    class AdminInputValidationException(val response: ErrorResponse) : Throwable()
}