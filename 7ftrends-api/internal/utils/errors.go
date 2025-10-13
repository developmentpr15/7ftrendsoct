package utils

import (
	"errors"
	"net/http"

	"github.com/7ftrends/api/internal/models"
)

// Common error types
var (
	ErrNotFound           = errors.New("resource not found")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrBadRequest         = errors.New("bad request")
	ErrConflict           = errors.New("conflict")
	ErrInternalServer     = errors.New("internal server error")
	ErrValidationFailed   = errors.New("validation failed")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrTokenExpired       = errors.New("token expired")
	ErrTokenInvalid       = errors.New("token invalid")
	ErrRateLimited        = errors.New("rate limit exceeded")
	ErrServiceUnavailable = errors.New("service unavailable")
	ErrFileSizeExceeded   = errors.New("file size exceeded")
	ErrFileTypeInvalid    = errors.New("file type invalid")
	ErrDuplicateResource  = errors.New("resource already exists")
	ErrInvalidInput       = errors.New("invalid input")
	ErrMissingRequired    = errors.New("missing required field")
	ErrInvalidFormat      = errors.New("invalid format")
)

// APIError represents an API error with additional context
type APIError struct {
	Err        error
	Code       string
	Message    string
	HTTPStatus int
	Details    interface{}
}

// Error implements the error interface
func (e *APIError) Error() string {
	if e.Err != nil {
		return e.Err.Error()
	}
	return e.Message
}

// Unwrap returns the underlying error
func (e *APIError) Unwrap() error {
	return e.Err
}

// NewAPIError creates a new API error
func NewAPIError(err error, code, message string, httpStatus int) *APIError {
	return &APIError{
		Err:        err,
		Code:       code,
		Message:    message,
		HTTPStatus: httpStatus,
	}
}

// WithDetails adds details to an API error
func (e *APIError) WithDetails(details interface{}) *APIError {
	e.Details = details
	return e
}

// Predefined API errors
var (
	APIErrorNotFound = &APIError{
		Err:        ErrNotFound,
		Code:       "NOT_FOUND",
		Message:    "The requested resource was not found",
		HTTPStatus: http.StatusNotFound,
	}

	APIErrorUnauthorized = &APIError{
		Err:        ErrUnauthorized,
		Code:       "UNAUTHORIZED",
		Message:    "Authentication is required to access this resource",
		HTTPStatus: http.StatusUnauthorized,
	}

	APIErrorForbidden = &APIError{
		Err:        ErrForbidden,
		Code:       "FORBIDDEN",
		Message:    "You don't have permission to access this resource",
		HTTPStatus: http.StatusForbidden,
	}

	APIErrorBadRequest = &APIError{
		Err:        ErrBadRequest,
		Code:       "BAD_REQUEST",
		Message:    "The request is invalid",
		HTTPStatus: http.StatusBadRequest,
	}

	APIErrorValidationFailed = &APIError{
		Err:        ErrValidationFailed,
		Code:       "VALIDATION_FAILED",
		Message:    "Request validation failed",
		HTTPStatus: http.StatusBadRequest,
	}

	APIErrorInvalidCredentials = &APIError{
		Err:        ErrInvalidCredentials,
		Code:       "INVALID_CREDENTIALS",
		Message:    "Invalid email or password",
		HTTPStatus: http.StatusUnauthorized,
	}

	APIErrorTokenExpired = &APIError{
		Err:        ErrTokenExpired,
		Code:       "TOKEN_EXPIRED",
		Message:    "Your session has expired, please login again",
		HTTPStatus: http.StatusUnauthorized,
	}

	APIErrorRateLimited = &APIError{
		Err:        ErrRateLimited,
		Code:       "RATE_LIMITED",
		Message:    "Too many requests, please try again later",
		HTTPStatus: http.StatusTooManyRequests,
	}

	APIErrorFileSizeExceeded = &APIError{
		Err:        ErrFileSizeExceeded,
		Code:       "FILE_SIZE_EXCEEDED",
		Message:    "File size exceeds the maximum allowed limit",
		HTTPStatus: http.StatusBadRequest,
	}

	APIErrorFileTypeInvalid = &APIError{
		Err:        ErrFileTypeInvalid,
		Code:       "FILE_TYPE_INVALID",
		Message:    "File type is not supported",
		HTTPStatus: http.StatusBadRequest,
	}

	APIErrorDuplicateResource = &APIError{
		Err:        ErrDuplicateResource,
		Code:       "DUPLICATE_RESOURCE",
		Message:    "Resource already exists",
		HTTPStatus: http.StatusConflict,
	}

	APIErrorInternalServer = &APIError{
		Err:        ErrInternalServer,
		Code:       "INTERNAL_SERVER_ERROR",
		Message:    "An internal server error occurred",
		HTTPStatus: http.StatusInternalServerError,
	}
)

// ValidationError represents a field validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Value   interface{} `json:"value,omitempty"`
}

// ValidationResult represents the result of validation
type ValidationResult struct {
	Errors []ValidationError `json:"errors"`
}

// AddError adds a validation error
func (vr *ValidationResult) AddError(field, message string, value interface{}) {
	vr.Errors = append(vr.Errors, ValidationError{
		Field:   field,
		Message: message,
		Value:   value,
	})
}

// HasErrors returns true if there are validation errors
func (vr *ValidationResult) HasErrors() bool {
	return len(vr.Errors) > 0
}

// ToAPIError converts validation result to API error
func (vr *ValidationResult) ToAPIError() *APIError {
	return APIErrorValidationFailed.WithDetails(vr.Errors)
}

// ErrorResponse creates a standardized error response
func ErrorResponse(err error) models.APIResponse {
	var apiErr *APIError

	// Check if it's already an APIError
	if errors.As(err, &apiErr) {
		return models.APIResponse{
			Success: false,
			Error: &models.ErrorInfo{
				Code:    apiErr.Code,
				Message: apiErr.Message,
				Details: apiErr.Details,
			},
		}
	}

	// Convert common errors to API errors
	switch {
	case errors.Is(err, ErrNotFound):
		return models.APIResponse{
			Success: false,
			Error: &models.ErrorInfo{
				Code:    "NOT_FOUND",
				Message: "The requested resource was not found",
			},
		}
	case errors.Is(err, ErrUnauthorized):
		return models.APIResponse{
			Success: false,
			Error: &models.ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "Authentication is required",
			},
		}
	case errors.Is(err, ErrForbidden):
		return models.APIResponse{
			Success: false,
			Error: &models.ErrorInfo{
				Code:    "FORBIDDEN",
				Message: "Access forbidden",
			},
		}
	case errors.Is(err, ErrValidationFailed):
		return models.APIResponse{
			Success: false,
			Error: &models.ErrorInfo{
				Code:    "VALIDATION_FAILED",
				Message: "Request validation failed",
			},
		}
	default:
		// Log unexpected errors in production
		return models.APIResponse{
			Success: false,
			Error: &models.ErrorInfo{
				Code:    "INTERNAL_SERVER_ERROR",
				Message: "An internal server error occurred",
			},
		}
	}
}

// SuccessResponse creates a standardized success response
func SuccessResponse(data interface{}, message string) models.APIResponse {
	return models.APIResponse{
		Success: true,
		Data:    data,
		Message: message,
	}
}

// PaginatedResponse creates a standardized paginated response
func PaginatedResponse(data interface{}, pagination models.Pagination, message string) models.APIResponse {
	return models.APIResponse{
		Success: true,
		Data: models.PaginatedResponse{
			Data:       data,
			Pagination: pagination,
		},
		Message: message,
	}
}