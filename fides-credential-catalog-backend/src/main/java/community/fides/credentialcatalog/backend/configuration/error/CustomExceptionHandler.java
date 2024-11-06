package community.fides.credentialcatalog.backend.configuration.error;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@ControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class CustomExceptionHandler extends ResponseEntityExceptionHandler {

    @SneakyThrows
    @ExceptionHandler(ErrorCodeException.class)
    public ResponseEntity<ErrorMessage> handleIErrorCodeException(
            ErrorCodeException errorCodeException,
            WebRequest request) {
        final ErrorMessage errorMessage = ErrorMessage.builder()
                .status(errorCodeException.getHttpStatus())
                .timestamp(LocalDateTime.now())
                .statusCode(errorCodeException.getErrorCode())
                .message(errorCodeException.getMessage())
                .statusMessage(errorCodeException.getMessage())
                .path(((ServletWebRequest) request).getRequest().getRequestURI())
                .build();
        return new ResponseEntity<>(errorMessage, errorCodeException.getHttpStatus());
    }

    @SneakyThrows
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ResponseEntity<ErrorMessage> handleOtherExceptions(
            Exception exception,
            WebRequest request) {
        final ErrorMessage errorMessage = ErrorMessage.builder()
                .status(HttpStatus.BAD_GATEWAY)
                .timestamp(LocalDateTime.now())
                .message(exception.getClass().getName())
                .path(((ServletWebRequest) request).getRequest().getRequestURI())
                .build();
        exception.printStackTrace();
        return new ResponseEntity<>(errorMessage, HttpStatus.BAD_REQUEST);
    }


    @Builder
    @ToString
    @Getter
    public static class ErrorMessage {
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy hh:mm:ss")
        private LocalDateTime timestamp;
        private HttpStatus status;
        private String statusCode;
        private String message;
        private String statusMessage;
        private String path;
    }
}
