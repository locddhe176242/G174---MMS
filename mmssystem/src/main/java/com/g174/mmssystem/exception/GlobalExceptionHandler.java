package com.g174.mmssystem.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

     // Handle ResourceNotFoundException
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleResourceNotFoundException(
            ResourceNotFoundException ex,
            WebRequest request) {

        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

      //Handle DuplicateResourceException
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponseDTO> handleDuplicateResourceException(
            DuplicateResourceException ex,
            WebRequest request) {

        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.CONFLICT.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

     // Handle InvalidCredentialsException
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidCredentialsException(
            InvalidCredentialsException ex,
            WebRequest request) {

        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

     // Handle TokenExpiredException
    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<ErrorResponseDTO> handleTokenExpiredException(
            TokenExpiredException ex,
            WebRequest request) {

        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

     // Handle UnauthorizedException

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnauthorizedException(
            UnauthorizedException ex,
            WebRequest request) {

        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.FORBIDDEN.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    // Handle EmailSendingException
    @ExceptionHandler(EmailSendingException.class)
    public ResponseEntity<ErrorResponseDTO> handleEmailSendingException(
            EmailSendingException ex,
            WebRequest request) {

        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

      //Handle Validation Errors (@Valid annotation)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("message", "Dữ liệu không hợp lệ");
        response.put("errors", errors);
        response.put("timestamp", LocalDateTime.now());

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }


     //Handle all other exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGlobalException(
            Exception ex,
            WebRequest request) {

        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Đã xảy ra lỗi: " + ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}