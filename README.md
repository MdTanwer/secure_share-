# SecureShare

A modern, secure secret sharing application built with Next.js 15, TypeScript, and Redis caching. Share sensitive information with encryption, access controls, and expiration settings.

![SecureShare](https://img.shields.io/badge/Next.js-15.3.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Redis](https://img.shields.io/badge/Redis-Upstash-red)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)

## 🚀 Features

- **🔐 Secure Secret Sharing**: End-to-end encrypted secret sharing with password protection
- **⏰ Auto Expiration**: Set custom expiration times (minutes to months)
- **👁️ View Limits**: Control how many times a secret can be accessed
- **🔒 Access Control**: Password protection and user authentication
- **📊 Analytics**: Track secret access and usage patterns
- **⚡ Redis Caching**: High-performance caching with Upstash Redis
- **🛡️ Rate Limiting**: Advanced rate limiting to prevent abuse
- **📱 Responsive UI**: Modern Material-UI design with dark/light themes
- **🔄 Real-time Updates**: tRPC for type-safe real-time communication

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Material-UI
- **Backend**: tRPC API routes, Prisma ORM
- **Database**: PostgreSQL (or your configured database)
- **Caching**: Upstash Redis for performance optimization
- **Authentication**: NextAuth.js with multiple providers
- **Styling**: Material-UI with custom theming

### Project Structure

```
secure_share/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── create/            # Secret creation page
│   ├── dashboard/         # User dashboard
│   ├── secret/           # Secret viewing/editing
│   └── globals.css       # Global styles
├── components/            # Reusable React components
│   ├── auth/             # Authentication components
│   ├── providers/        # Context providers
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   ├── redis.ts          # Redis configuration and utilities
│   ├── rate-limiter.ts   # Rate limiting system
│   ├── types.ts          # TypeScript type definitions
│   ├── constants.ts      # Application constants
│   └── mui-components.tsx # Material-UI exports
├── prisma/               # Database schema and migrations
├── server/               # tRPC server configuration
│   └── api/              # tRPC routers
└── public/               # Static assets
```

### Key Components

#### 1. **Redis Cache System** (`lib/redis.ts`)

- Upstash Redis integration
- Cache utilities for users, secrets, sessions
- Rate limiting data storage
- Analytics and monitoring

#### 2. **Rate Limiting** (`lib/rate-limiter.ts`)

- Multiple rate limiting strategies
- IP-based and user-based limits
- Configurable limits per endpoint
- Burst protection

#### 3. **tRPC API** (`server/api/`)

- Type-safe API routes
- Secret CRUD operations
- User authentication
- Access logging

#### 4. **Database Schema** (`prisma/schema.prisma`)

- User management
- Secret storage with metadata
- Access logging
- Sharing permissions

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (or your preferred database)
- Upstash Redis account

### 1. Clone Repository

```bash
git clone <repository-url>
cd secure_share
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/secureshare"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### 5. Redis Setup

The application includes Redis configuration for Upstash. If you're using a different Redis provider, update the configuration in `lib/redis.ts`.

### 6. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit `http://localhost:3000` to access the application.

## 🎯 Usage

### Creating Secrets

1. **Navigate to Create Page**: Click "Create Secret" or visit `/create`
2. **Enter Content**: Add your secret content (text-based)
3. **Configure Security**:
   - **Password Protection**: Add password requirement
   - **Auto Expiration**: Set expiration time (15 minutes to 1 year)
   - **View Limits**: Limit number of views (1-100)
4. **Create & Share**: Get shareable link

### Managing Secrets

- **Dashboard**: View all your secrets at `/dashboard`
- **Edit Secrets**: Modify content and security settings
- **View Analytics**: See access logs and statistics
- **Delete Secrets**: Soft delete with data retention

### Accessing Shared Secrets

1. **Open Link**: Visit the shared secret URL
2. **Enter Password**: If password protected
3. **View Content**: Secret content is displayed
4. **Auto-cleanup**: Secret may be deleted after viewing (if configured)

### Security Features

- **Encryption**: All secrets are encrypted at rest
- **Access Control**: User authentication and authorization
- **Rate Limiting**: Prevents brute force and abuse
- **Audit Trail**: Complete access logging
- **Auto Expiration**: Automatic cleanup of expired secrets

## 🔧 Configuration

### Redis Configuration

Update `lib/redis.ts` for custom Redis settings:

```typescript
// Cache TTL configurations
export const CACHE_TTL = {
  USER_SESSION: 24 * 60 * 60, // 24 hours
  SECRET_METADATA: 12 * 60 * 60, // 12 hours
  RATE_LIMIT: 60 * 60, // 1 hour
  EMAIL_VERIFICATION: 15 * 60, // 15 minutes
} as const;
```

### Rate Limiting

Customize rate limits in `lib/rate-limiter.ts`:

```typescript
export const RATE_LIMITS = {
  LOGIN: { max: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  REGISTER: { max: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
  CREATE_SECRET: { max: 10, window: 60 * 60 * 1000 }, // 10 secrets per hour
} as const;
```

### Expiration Options

Modify expiration settings in `lib/constants.ts`:

```typescript
export const EXPIRATION_OPTIONS = [
  { value: 15, unit: "minutes" as const, label: "15 minutes" },
  { value: 1, unit: "hours" as const, label: "1 hour" },
  { value: 24, unit: "hours" as const, label: "24 hours" },
  // Add more options...
] as const;
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Import project to Vercel
2. **Environment Variables**: Add all required env vars
3. **Database**: Ensure database is accessible
4. **Redis**: Configure Upstash Redis
5. **Deploy**: Automatic deployment on push

### Docker

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Checklist

- [ ] Database connection string
- [ ] NextAuth secret and URL
- [ ] Redis credentials
- [ ] OAuth provider credentials
- [ ] Domain configuration

## 🧪 Testing

### API Testing

Test Redis functionality:

```bash
# Visit in browser or curl
GET /api/redis-test

# Test cache operations
POST /api/redis-test
{
  "operation": "set",
  "key": "test-key",
  "value": "test-value"
}
```

### Rate Limiting Test

```bash
# Test rate limits (will return 429 after limit)
for i in {1..10}; do curl http://localhost:3000/api/redis-test; done
```

## 🔒 Security Considerations

- **Environment Variables**: Never commit secrets to version control
- **HTTPS**: Use HTTPS in production
- **Database Security**: Use connection pooling and SSL
- **Rate Limiting**: Monitor and adjust limits based on usage
- **Access Logs**: Regular security audit of access patterns
- **Backup Strategy**: Regular database and Redis backups

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection**: Verify Upstash credentials and network access
2. **Database Issues**: Check connection string and migrations
3. **Build Errors**: Clear `.next` folder and rebuild
4. **TypeScript Errors**: Run `npx prisma generate` to update types

### Debug Mode

Enable debug logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

## 📞 Support

- **Issues**: Create GitHub issue
- **Documentation**: Check `/docs` folder
- **Community**: Join our Discord server

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
