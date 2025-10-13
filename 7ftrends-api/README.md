# 7Ftrends API

A clean, secure Go API for the 7Ftrends fashion try-on and social platform.

## 🚀 Features

- **Clean Architecture**: Layered pattern with separation of concerns
- **Security**: JWT authentication, CORS, rate limiting, input validation
- **Database**: Supabase integration with PostgreSQL
- **AI Integration**: Gemini API for image processing and outfit recommendations
- **File Storage**: Supabase Storage for images and media
- **Real-time**: WebSocket support for live features
- **API Documentation**: RESTful design with comprehensive endpoints
- **Docker**: Containerized deployment support
- **Testing**: Unit and integration test coverage

## 📋 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh JWT token
- `GET /me` - Get current user profile
- `PUT /me` - Update user profile
- `PUT /me/password` - Change password

### Posts (`/api/v1/posts`)
- `GET /` - Get posts with pagination
- `GET /:id` - Get single post
- `POST /` - Create post (auth required)
- `PUT /:id` - Update post (auth required)
- `DELETE /:id` - Delete post (auth required)
- `POST /:id/like` - Like post
- `POST /:id/save` - Save post
- `GET /:id/comments` - Get post comments
- `POST /:id/comments` - Create comment

### Competitions (`/api/v1/competitions`)
- `GET /` - Get competitions
- `GET /:id` - Get competition details
- `POST /` - Create competition (auth required)
- `GET /:id/entries` - Get competition entries
- `POST /:id/entries` - Submit entry (auth required)
- `POST /entries/:id/vote` - Vote for entry (auth required)

### AR Try-On (`/api/v1/tryon`)
- `POST /process` - Process AR try-on request
- `GET /sessions` - Get user try-on sessions
- `GET /wardrobe` - Get wardrobe items
- `POST /wardrobe` - Add wardrobe item
- `GET /outfits` - Get user outfits
- `POST /generate-suggestions` - Generate outfit suggestions

### File Upload (`/api/v1/upload`)
- `POST /image` - Upload single image
- `POST /images` - Upload multiple images
- `GET /presigned-url` - Get presigned upload URL
- `DELETE /:id` - Delete file

### Voting (`/api/v1/votes`)
- Integrated into competitions and posts
- Judge voting for competitions
- Public voting with rate limiting

## 🏗️ Architecture

```
├── cmd/api/           # Application entry point
├── internal/
│   ├── config/        # Configuration management
│   ├── middleware/    # HTTP middleware (auth, CORS, rate limiting)
│   ├── models/        # Data models and types
│   ├── handlers/      # HTTP request handlers
│   ├── services/      # Business logic layer
│   ├── repository/    # Data access layer
│   ├── utils/         # Utility functions
│   └── router/        # Route configuration
├── pkg/               # Public packages
├── configs/           # Configuration files
├── docs/              # Documentation
├── tests/             # Test files
└── docker/            # Docker configuration
```

## 🛠️ Tech Stack

- **Go 1.21+** - Primary language
- **Gin** - HTTP web framework
- **Supabase** - Database and auth
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **Gemini API** - AI image processing
- **Docker** - Containerization

## 🚀 Quick Start

### Prerequisites
- Go 1.21 or higher
- Supabase project
- Gemini API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/7ftrends-api.git
cd 7ftrends-api
```

2. **Set up development environment**
```bash
make quick-start
```

3. **Configure environment variables**
```bash
# Edit .env file with your actual values
nano .env
```

4. **Run the server**
```bash
make run
```

5. **Verify installation**
```bash
curl http://localhost:8080/health
```

## ⚙️ Configuration

### Environment Variables
```bash
# Server
PORT=8080
GIN_MODE=release

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# File Storage
MAX_FILE_SIZE=5242880
```

### Configuration File
Copy `configs/config.example.yaml` to `configs/config.yaml` and customize:

```yaml
server:
  port: "8080"
  mode: "release"

supabase:
  url: "https://your-project.supabase.co"
  service_key: "your-service-key"

auth:
  jwt_secret: "your-jwt-secret"
  jwt_expiration: 3600

storage:
  max_file_size: 5242880
  allowed_types:
    - "image/jpeg"
    - "image/png"
    - "image/webp"
```

## 🧪 Testing

### Run all tests
```bash
make test
```

### Run unit tests
```bash
make test-unit
```

### Run integration tests
```bash
make test-integration
```

### Generate coverage report
```bash
make test-coverage
```

## 🐳 Docker

### Build image
```bash
make docker-build
```

### Run container
```bash
make docker-run
```

### Production deployment
```bash
make docker-build-prod
make docker-push
```

## 📝 API Documentation

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### Rate Limiting
- General: 10 requests/second
- Auth endpoints: 2 requests/second
- Upload endpoints: 2 requests/second
- AI try-on: 1 request/second

### File Upload
- Max file size: 5MB
- Allowed formats: JPEG, PNG, WebP
- Max image dimension: 2048x2048

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configurable cross-origin policies
- **Rate Limiting**: Multiple rate limiting strategies
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Type and size validation
- **HTTPS Enforcement**: Production SSL/TLS only

## 🧰 Development Tools

### Code Quality
```bash
make fmt          # Format code
make lint         # Run linter
make vet          # Run go vet
make mod-tidy     # Tidy modules
```

### Database Migrations
```bash
make migrate-up       # Run migrations up
make migrate-down     # Run migrations down
make migrate-create   # Create new migration
```

### Performance Profiling
```bash
make profile-cpu      # CPU profiling
make profile-memory   # Memory profiling
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8080/health
```

### API Info
```bash
curl http://localhost:8080/api/v1/info
```

### Logging
- Structured JSON logging
- Configurable log levels
- Request/response logging
- Error tracking

## 🚀 Deployment

### Production Build
```bash
make build-prod
```

### Environment Setup
```bash
# Production environment variables
export GIN_MODE=release
export PORT=8080
export SUPABASE_URL=your-production-url
export JWT_SECRET=your-production-secret
```

### Docker Deployment
```bash
# Build and push to registry
make docker-build-prod
make docker-push

# Run with environment file
docker run -d \
  --env-file .env.prod \
  -p 8080:8080 \
  --name 7ftrends-api \
  7ftrends-api:latest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow Go conventions
- Run `make fmt` before committing
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@7ftrends.com
- 📖 Documentation: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/7ftrends-api/issues)
- 💬 Discord: [Join our community](https://discord.gg/7ftrends)

## 🗺️ Roadmap

- [ ] GraphQL API support
- [ ] Advanced AI styling features
- [ ] Real-time collaboration
- [ ] Mobile API optimization
- [ ] Advanced analytics dashboard
- [ ] Multi-region deployment
- [ ] GraphQL subscriptions
- [ ] Advanced recommendation engine

---

**Built with ❤️ by the 7Ftrends team**