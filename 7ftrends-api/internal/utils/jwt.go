package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

// GenerateRequestID generates a unique request ID
func GenerateRequestID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// GenerateToken generates a random token
func GenerateToken(length int) string {
	bytes := make([]byte, length)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// GetTime returns the current time in UTC
func GetTime() time.Time {
	return time.Now().UTC()
}

// FormatTime formats a time in a standard way
func FormatTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

// ParseTime parses a time string in RFC3339 format
func ParseTime(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}

// CalculateAge calculates age from birth date
func CalculateAge(birthDate time.Time) int {
	now := GetTime()
	age := now.Year() - birthDate.Year()
	if now.Month() < birthDate.Month() || (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}
	return age
}

// TimeAgo returns a human-readable "time ago" string
func TimeAgo(t time.Time) string {
	now := GetTime()
	diff := now.Sub(t)

	if diff < time.Minute {
		return "just now"
	} else if diff < time.Hour {
		minutes := int(diff.Minutes())
		return fmt.Sprintf("%d minute%s ago", minutes, pluralize(minutes))
	} else if diff < 24*time.Hour {
		hours := int(diff.Hours())
		return fmt.Sprintf("%d hour%s ago", hours, pluralize(hours))
	} else if diff < 30*24*time.Hour {
		days := int(diff.Hours() / 24)
		return fmt.Sprintf("%d day%s ago", days, pluralize(days))
	} else if diff < 365*24*time.Hour {
		months := int(diff.Hours() / 24 / 30)
		return fmt.Sprintf("%d month%s ago", months, pluralize(months))
	} else {
		years := int(diff.Hours() / 24 / 365)
		return fmt.Sprintf("%d year%s ago", years, pluralize(years))
	}
}

// pluralize adds 's' if the count is not 1
func pluralize(count int) string {
	if count == 1 {
		return ""
	}
	return "s"
}

// IsValidEmail validates email format (basic validation)
func IsValidEmail(email string) bool {
	// Basic email validation - in production, use a proper email validation library
	return len(email) > 3 && len(email) < 254 &&
		   Contains(email, "@") &&
		   Contains(email, ".") &&
		   !HasPrefix(email, "@") &&
		   !HasSuffix(email, "@") &&
		   !HasPrefix(email, ".") &&
		   !HasSuffix(email, ".")
}

// SanitizeString removes potentially dangerous characters
func SanitizeString(s string) string {
	// Basic sanitization - in production, use proper sanitization libraries
	// This is just a placeholder implementation
	return s
}

// Contains checks if a string contains a substring
func Contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		   (s == substr ||
		    len(s) > len(substr) &&
		    (s[:len(substr)] == substr ||
		     s[len(s)-len(substr):] == substr ||
		     indexOf(s, substr) >= 0))
}

// HasPrefix checks if a string starts with a prefix
func HasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}

// HasSuffix checks if a string ends with a suffix
func HasSuffix(s, suffix string) bool {
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
}

// indexOf finds the index of a substring
func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

// GenerateSlug creates a URL-friendly slug from a string
func GenerateSlug(s string) string {
	// Basic slug generation - in production, use proper slug libraries
	slug := ""
	for _, char := range s {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') {
			slug += string(char)
		} else if char >= 'A' && char <= 'Z' {
			slug += string(char + 32) // Convert to lowercase
		} else if char == ' ' || char == '-' || char == '_' {
			if len(slug) > 0 && slug[len(slug)-1] != '-' {
				slug += "-"
			}
		}
	}

	// Remove trailing dashes
	for len(slug) > 0 && slug[len(slug)-1] == '-' {
		slug = slug[:len(slug)-1]
	}

	return slug
}

// TruncateString truncates a string to a maximum length
func TruncateString(s string, maxLength int) string {
	if len(s) <= maxLength {
		return s
	}

	if maxLength <= 3 {
		return s[:maxLength]
	}

	return s[:maxLength-3] + "..."
}

// EscapeHTML escapes HTML characters
func EscapeHTML(s string) string {
	// Basic HTML escaping - in production, use proper HTML escaping libraries
	replacements := map[string]string{
		"&":  "&amp;",
		"<":  "&lt;",
		">":  "&gt;",
		"\"": "&quot;",
		"'":  "&#39;",
	}

	result := ""
	for _, char := range s {
		str := string(char)
		if replacement, exists := replacements[str]; exists {
			result += replacement
		} else {
			result += str
		}
	}

	return result
}

// ValidatePassword validates password strength
func ValidatePassword(password string) []string {
	var errors []string

	if len(password) < 8 {
		errors = append(errors, "Password must be at least 8 characters long")
	}

	if len(password) > 128 {
		errors = append(errors, "Password must be less than 128 characters long")
	}

	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case char == '!' || char == '@' || char == '#' || char == '$' || char == '%' ||
		     char == '^' || char == '&' || char == '*' || char == '(' || char == ')' ||
		     char == '-' || char == '_' || char == '+' || char == '=' || char == '{' ||
		     char == '}' || char == '[' || char == ']' || char == '|' || char == '\\' ||
		     char == ':' || char == ';' || char == '"' || char == '\'' || char == '<' ||
		     char == '>' || char == ',' || char == '.' || char == '?' || char == '/':
			hasSpecial = true
		}
	}

	if !hasUpper {
		errors = append(errors, "Password must contain at least one uppercase letter")
	}

	if !hasLower {
		errors = append(errors, "Password must contain at least one lowercase letter")
	}

	if !hasNumber {
		errors = append(errors, "Password must contain at least one number")
	}

	if !hasSpecial {
		errors = append(errors, "Password must contain at least one special character")
	}

	return errors
}

// IsValidURL validates URL format (basic validation)
func IsValidURL(url string) bool {
	if len(url) < 8 {
		return false
	}

	return HasPrefix(url, "http://") || HasPrefix(url, "https://")
}

// FormatBytes formats bytes in human-readable format
func FormatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

// Min returns the minimum of two integers
func Min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Max returns the maximum of two integers
func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// Clamp clamps a value between min and max
func Clamp(value, min, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}