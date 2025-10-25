package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/spf13/viper"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Supabase SupabaseConfig `mapstructure:"supabase"`
	Auth     AuthConfig     `mapstructure:"auth"`
	Storage  StorageConfig  `mapstructure:"storage"`
	AI       AIConfig       `mapstructure:"ai"`
	Logger   LoggerConfig   `mapstructure:"logger"`
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port         string `mapstructure:"port"`
	Host         string `mapstructure:"host"`
	Mode         string `mapstructure:"mode"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`
	IdleTimeout  int    `mapstructure:"idle_timeout"`
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
	SSLMode  string `mapstructure:"ssl_mode"`
}

// SupabaseConfig holds Supabase configuration
type SupabaseConfig struct {
	URL      string `mapstructure:"url"`
	Key      string `mapstructure:"key"`
	ServiceKey string `mapstructure:"service_key"`
	ProjectID string `mapstructure:"project_id"`
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	JWTSecret     string `mapstructure:"jwt_secret"`
	JWTExpiration int    `mapstructure:"jwt_expiration"`
	RefreshExpiration int `mapstructure:"refresh_expiration"`
}

// StorageConfig holds storage configuration
type StorageConfig struct {
	MaxFileSize     int64    `mapstructure:"max_file_size"`
	AllowedTypes    []string `mapstructure:"allowed_types"`
	BucketName      string   `mapstructure:"bucket_name"`
	CompressionQuality int   `mapstructure:"compression_quality"`
	// R2/S3-compatible fields
	Region          string `mapstructure:"region"`
	Endpoint        string `mapstructure:"endpoint"`
	AccessKeyID     string `mapstructure:"access_key_id"`
	SecretAccessKey string `mapstructure:"secret_access_key"`
	PublicBaseURL   string `mapstructure:"public_base_url"`
	UsePathStyle    bool   `mapstructure:"use_path_style"`
}

// AIConfig holds AI service configuration
type AIConfig struct {
	GeminiAPIKey string `mapstructure:"gemini_api_key"`
	Endpoint     string `mapstructure:"endpoint"`
	Timeout      int    `mapstructure:"timeout"`
}

// LoggerConfig holds logger configuration
type LoggerConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"`
	Output     string `mapstructure:"output"`
	MaxSize    int    `mapstructure:"max_size"`
	MaxBackups int    `mapstructure:"max_backups"`
	MaxAge     int    `mapstructure:"max_age"`
}

// LoadConfig loads configuration from file and environment variables
func LoadConfig(path string) (*Config, error) {
	var config Config

	// Set config file path and name
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(path)
	viper.AddConfigPath("./configs")
	viper.AddConfigPath(".")

	// Enable environment variable support
	viper.AutomaticEnv()
	viper.SetEnvPrefix("SEVFTRENDS")

	// Set default values
	setDefaults()

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		// If config file doesn't exist, use environment variables only
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	// Unmarshal config into struct
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	// Override with environment variables
	overrideWithEnv(&config)

	return &config, nil
}

// setDefaults sets default configuration values
func setDefaults() {
	// Server defaults
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.mode", "release")
	viper.SetDefault("server.read_timeout", 30)
	viper.SetDefault("server.write_timeout", 30)
	viper.SetDefault("server.idle_timeout", 60)

	// Database defaults
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.name", "7ftrends")
	viper.SetDefault("database.ssl_mode", "require")

	// Auth defaults
	viper.SetDefault("auth.jwt_expiration", 3600) // 1 hour
	viper.SetDefault("auth.refresh_expiration", 604800) // 7 days

	// Storage defaults
	viper.SetDefault("storage.max_file_size", 5242880) // 5MB
	viper.SetDefault("storage.allowed_types", []string{"image/jpeg", "image/png", "image/webp"})
	viper.SetDefault("storage.compression_quality", 80)

	// AI defaults
	viper.SetDefault("ai.timeout", 30)

	// Logger defaults
	viper.SetDefault("logger.level", "info")
	viper.SetDefault("logger.format", "json")
	viper.SetDefault("logger.output", "stdout")
}

// overrideWithEnv overrides configuration with environment variables
func overrideWithEnv(config *Config) {
	if port := os.Getenv("PORT"); port != "" {
		config.Server.Port = port
	}

	if host := os.Getenv("HOST"); host != "" {
		config.Server.Host = host
	}

	if mode := os.Getenv("GIN_MODE"); mode != "" {
		config.Server.Mode = mode
	}

	// Supabase environment variables
	if url := os.Getenv("SUPABASE_URL"); url != "" {
		config.Supabase.URL = url
	}

	if key := os.Getenv("SUPABASE_KEY"); key != "" {
		config.Supabase.Key = key
	}

	if serviceKey := os.Getenv("SUPABASE_SERVICE_KEY"); serviceKey != "" {
		config.Supabase.ServiceKey = serviceKey
	}

	// JWT secret
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		config.Auth.JWTSecret = jwtSecret
	}

	// AI API key
	if geminiKey := os.Getenv("GEMINI_API_KEY"); geminiKey != "" {
		config.AI.GeminiAPIKey = geminiKey
	}

	// File size
	if maxSize := os.Getenv("MAX_FILE_SIZE"); maxSize != "" {
		if size, err := strconv.ParseInt(maxSize, 10, 64); err == nil {
			config.Storage.MaxFileSize = size
		}
	}

	// R2 / S3-compatible storage overrides
	if region := os.Getenv("R2_REGION"); region != "" {
		config.Storage.Region = region
	}
	if endpoint := os.Getenv("R2_ENDPOINT"); endpoint != "" {
		config.Storage.Endpoint = endpoint
	}
	if accessKey := os.Getenv("R2_ACCESS_KEY_ID"); accessKey != "" {
		config.Storage.AccessKeyID = accessKey
	}
	if secretKey := os.Getenv("R2_SECRET_ACCESS_KEY"); secretKey != "" {
		config.Storage.SecretAccessKey = secretKey
	}
	if bucket := os.Getenv("R2_BUCKET_NAME"); bucket != "" {
		config.Storage.BucketName = bucket
	}
	if pub := os.Getenv("R2_PUBLIC_BASE_URL"); pub != "" {
		config.Storage.PublicBaseURL = pub
	}
	if usePath := os.Getenv("R2_USE_PATH_STYLE"); usePath != "" {
		if v, err := strconv.ParseBool(usePath); err == nil {
			config.Storage.UsePathStyle = v
		}
	}
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Auth.JWTSecret == "" {
		return fmt.Errorf("JWT secret is required")
	}

	if c.Supabase.URL == "" {
		return fmt.Errorf("Supabase URL is required")
	}

	if c.Supabase.ServiceKey == "" {
		return fmt.Errorf("Supabase service key is required")
	}

	if c.Storage.MaxFileSize <= 0 {
		return fmt.Errorf("max file size must be positive")
	}

	if len(c.Storage.AllowedTypes) == 0 {
		return fmt.Errorf("allowed file types cannot be empty")
	}

	return nil
}

// GetDSN returns database connection string
func (c *Config) GetDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.Name,
		c.Database.SSLMode,
	)
}

// GetAddr returns server address
func (c *Config) GetAddr() string {
	return fmt.Sprintf("%s:%s", c.Server.Host, c.Server.Port)
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Server.Mode == "debug"
}

// IsProduction returns true if running in production mode
func (c *Config) IsProduction() bool {
	return c.Server.Mode == "release"
}