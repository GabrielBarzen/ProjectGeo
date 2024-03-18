package se.gabnet.projectgeo.index.inputvalidation

import org.springframework.http.HttpStatus

class AdminInputValidationHandling {
    open class ErrorResponse(
            val ERROR: String,
            val httpStatus: HttpStatus
    )

    class AdminInputValidationException(val response: ErrorResponse) : Throwable()
}