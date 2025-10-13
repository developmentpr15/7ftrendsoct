# 7Ftrends API Makefile

.PHONY: help build run clean test lint fmt docker-build docker-run migrate-up migrate-down dev-setup install-deps

# Default target
help:
	@echo "7Ftrends API - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  dev-setup         - Setup development environment"
	@echo "  install-deps      - Install Go dependencies"
	@echo "  run               - Run the API server"
	@echo "  build             - Build the application"
	@echo "  clean             - Clean build artifacts"
	@echo ""
	@echo "Testing:"
	@echo "  test              - Run all tests"
	@echo "  test-unit         - Run unit tests"
	@echo "  test-integration  - Run integration tests"
	@echo "  test-coverage     - Run tests with coverage"
	@echo ""
	@echo "Code Quality:"
	@echo "  fmt               - Format Go code"
	@echo "  lint              - Run linter"
	@echo "  vet               - Run go vet"
	@echo "  mod-tidy          - Tidy Go modules"
	@echo "  mod-verify        - Verify Go modules"
	@echo ""
	@echo "Database:"
	@echo "  migrate-up        - Run database migrations up"
	@echo "  migrate-down      - Run database migrations down"
	@echo "  migrate-create    - Create new migration"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build      - Build Docker image"
	@echo "  docker-run        - Run Docker container"
	@echo "  docker-stop       - Stop Docker container"
	@echo "  docker-clean      - Clean Docker resources"
	@echo ""
	@echo "Production:"
	@echo "  build-prod        - Build for production"
	@echo "  deploy            - Deploy application"

# Variables
APP_NAME := 7ftrends-api
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT_SHA := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LDFLAGS := -ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.CommitSHA=$(COMMIT_SHA)"
DOCKER_IMAGE := $(APP_NAME):$(VERSION)
DOCKER_REGISTRY := your-registry.com
PORT := 8080

# Development targets
dev-setup:
	@echo "Setting up development environment..."
	go install -a github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install -a github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	go install -a github.com/air-verse/air@latest
	cp configs/config.example.yaml configs/config.yaml
	@echo "Development environment setup complete!"

install-deps:
	@echo "Installing Go dependencies..."
	go mod download
	go mod verify

run:
	@echo "Running 7Ftrends API..."
	go run cmd/api/main.go

run-dev:
	@echo "Running 7Ftrends API in development mode..."
	AIR_PROFILES=.air go run github.com/air-verse/air@latest

run-prod:
	@echo "Running 7Ftrends API in production mode..."
	GIN_MODE=release go run cmd/api/main.go

# Build targets
build:
	@echo "Building 7Ftrends API..."
	go build $(LDFLAGS) -o bin/$(APP_NAME) cmd/api/main.go

build-prod:
	@echo "Building 7Ftrends API for production..."
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-linux-amd64 cmd/api/main.go
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-darwin-amd64 cmd/api/main.go
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-windows-amd64.exe cmd/api/main.go

build-all:
	@echo "Building 7Ftrends API for all platforms..."
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-linux-amd64 cmd/api/main.go
	GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o bin/$(APP_NAME)-linux-arm64 cmd/api/main.go
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-darwin-amd64 cmd/api/main.go
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o bin/$(APP_NAME)-darwin-arm64 cmd/api/main.go
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-windows-amd64.exe cmd/api/main.go

clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	rm -f $(APP_NAME)
	go clean -cache

# Testing targets
test:
	@echo "Running all tests..."
	go test -v ./...

test-unit:
	@echo "Running unit tests..."
	go test -v -short ./...

test-integration:
	@echo "Running integration tests..."
	go test -v -tags=integration ./tests/integration/...

test-coverage:
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

test-race:
	@echo "Running tests with race detection..."
	go test -race -v ./...

benchmark:
	@echo "Running benchmarks..."
	go test -bench=. -benchmem ./...

# Code quality targets
fmt:
	@echo "Formatting Go code..."
	go fmt ./...
	goimports -w .

lint:
	@echo "Running linter..."
	golangci-lint run

lint-fix:
	@echo "Running linter with fixes..."
	golangci-lint run --fix

vet:
	@echo "Running go vet..."
	go vet ./...

mod-tidy:
	@echo "Tidying Go modules..."
	go mod tidy

mod-verify:
	@echo "Verifying Go modules..."
	go mod verify

mod-update:
	@echo "Updating Go modules..."
	go get -u ./...
	go mod tidy

# Database targets
migrate-up:
	@echo "Running database migrations up..."
	migrate -path migrations -database "postgres://user:password@localhost:5432/7ftrends?sslmode=disable" up

migrate-down:
	@echo "Running database migrations down..."
	migrate -path migrations -database "postgres://user:password@localhost:5432/7ftrends?sslmode=disable" down

migrate-create:
	@echo "Creating new migration..."
	@if [ -z "$(NAME)" ]; then echo "Usage: make migrate-create NAME=migration_name"; exit 1; fi
	migrate create -ext sql -dir migrations -seq $(NAME)

migrate-force:
	@echo "Forcing migration version..."
	@if [ -z "$(VERSION)" ]; then echo "Usage: make migrate-force VERSION=1"; exit 1; fi
	migrate -path migrations -database "postgres://user:password@localhost:5432/7ftrends?sslmode=disable" force $(VERSION)

# Docker targets
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE) .

docker-build-prod:
	@echo "Building production Docker image..."
	docker build -f docker/Dockerfile.prod -t $(DOCKER_IMAGE) .

docker-run:
	@echo "Running Docker container..."
	docker run -p $(PORT):8080 --env-file .env --name $(APP_NAME) $(DOCKER_IMAGE)

docker-run-detach:
	@echo "Running Docker container in detached mode..."
	docker run -d -p $(PORT):8080 --env-file .env --name $(APP_NAME) $(DOCKER_IMAGE)

docker-stop:
	@echo "Stopping Docker container..."
	docker stop $(APP_NAME)

docker-rm:
	@echo "Removing Docker container..."
	docker rm $(APP_NAME)

docker-clean:
	@echo "Cleaning Docker resources..."
	docker stop $(APP_NAME) || true
	docker rm $(APP_NAME) || true
	docker rmi $(DOCKER_IMAGE) || true

docker-push:
	@echo "Pushing Docker image..."
	docker tag $(DOCKER_IMAGE) $(DOCKER_REGISTRY)/$(DOCKER_IMAGE)
	docker push $(DOCKER_REGISTRY)/$(DOCKER_IMAGE)

# Deployment targets
deploy-staging:
	@echo "Deploying to staging..."
	# Add your staging deployment commands here

deploy-prod:
	@echo "Deploying to production..."
	# Add your production deployment commands here

# Utility targets
install-tools:
	@echo "Installing development tools..."
	go install -a github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install -a github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	go install -a github.com/air-verse/air@latest
	go install -a golang.org/x/tools/cmd/goimports@latest
	go install -a github.com/golang/protobuf/protoc-gen-go@latest

check-deps:
	@echo "Checking for outdated dependencies..."
	go list -u -m -json all | go-mod-outdated -update -direct

security-scan:
	@echo "Running security scan..."
	gosec ./...

generate-docs:
	@echo "Generating API documentation..."
	swag init -g cmd/api/main.go -o docs/

# Performance profiling
profile-cpu:
	@echo "Running CPU profiling..."
	go tool pprof http://localhost:$(PORT)/debug/pprof/profile

profile-memory:
	@echo "Running memory profiling..."
	go tool pprof http://localhost:$(PORT)/debug/pprof/heap

# Health check
health-check:
	@echo "Checking API health..."
	curl -f http://localhost:$(PORT)/health || echo "API is not healthy"

# Load testing
load-test:
	@echo "Running load tests..."
	@if [ -z "$(URL)" ]; then echo "Usage: make load-test URL=http://localhost:$(PORT)"; exit 1; fi
	hey -n 1000 -c 10 $(URL)

# Backup and restore
backup-db:
	@echo "Creating database backup..."
	pg_dump -h localhost -U postgres -d 7ftrends > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db:
	@echo "Restoring database from backup..."
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore-db FILE=backup.sql"; exit 1; fi
	psql -h localhost -U postgres -d 7ftrends < $(FILE)

# Environment setup
create-env:
	@echo "Creating .env file..."
	@echo "# 7Ftrends API Environment Variables" > .env
	@echo "PORT=$(PORT)" >> .env
	@echo "GIN_MODE=debug" >> .env
	@echo "SUPABASE_URL=https://your-project.supabase.co" >> .env
	@echo "SUPABASE_SERVICE_KEY=your-service-key" >> .env
	@echo "JWT_SECRET=your-super-secret-jwt-key" >> .env
	@echo "GEMINI_API_KEY=your-gemini-api-key" >> .env
	@echo "MAX_FILE_SIZE=5242880" >> .env
	@echo ".env file created. Please update with your actual values."

# Quick start for new developers
quick-start: dev-setup install-deps create-env
	@echo ""
	@echo "Quick start complete!"
	@echo "1. Update .env with your actual values"
	@echo "2. Run 'make run' to start the API server"
	@echo "3. Visit http://localhost:$(PORT)/health to check if it's working"