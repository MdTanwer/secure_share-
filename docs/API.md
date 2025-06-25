# SecureShare API Documentation

## Overview

SecureShare uses tRPC for type-safe API communication between the frontend and backend. All APIs are automatically typed and provide excellent developer experience with IntelliSense support.

## Base Configuration

### tRPC Setup

```typescript
// Client-side usage
import { trpc } from "@/components/providers/trpc-provider";

// Example usage
const { data, isLoading, error } = trpc.secret.getAll.useQuery();
```

### Authentication

Most endpoints require authentication via NextAuth.js session. Protected routes will automatically redirect unauthenticated users.

## Secret Management API

### `secret.getAll`

Get all secrets for the authenticated user.

**Type**: `Query`  
**Auth**: Required  
**Input**: None

```typescript
const { data: secrets } = trpc.secret.getAll.useQuery();

// Response type
type Secret = {
  id: string;
  title: string | null;
  content: string;
  password: string | null;
  expiresAt: Date | null;
  maxViews: number | null;
  currentViews: number;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}[];
```

### `secret.getById`

Get a specific secret by ID.

**Type**: `Query`  
**Auth**: Not required (public secrets)  
**Input**: `{ id: string }`

```typescript
const { data: secret } = trpc.secret.getById.useQuery({
  id: "secret-id",
});

// Response includes validation for:
// - Secret existence
// - Expiration status
// - View limits
// - Active status
```

**Error Cases**:

- `Secret not found`
- `Secret has expired`
- `Secret has reached maximum views`
- `Secret is not active`

### `secret.create`

Create a new secret.

**Type**: `Mutation`  
**Auth**: Required  
**Input**:

```typescript
{
  title: string;                    // Required, min 1 char
  description?: string;             // Optional
  content: string;                  // Required, min 1 char
  contentType?: "TEXT" | "FILE";    // Default: "TEXT"
  password?: string;                // Optional password protection
  expiresAt?: Date;                 // Optional expiration date
  deleteAfterView?: boolean;        // Default: false
  isPublic?: boolean;               // Default: false
  maxViews?: number;                // Optional, positive number
}
```

```typescript
const createSecret = trpc.secret.create.useMutation({
  onSuccess: (data) => {
    console.log(`Secret created with ID: ${data.id}`);
  },
  onError: (error) => {
    console.error("Failed to create secret:", error.message);
  },
});

// Usage
createSecret.mutate({
  title: "My Secret",
  content: "Secret content here",
  password: "optional-password",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  maxViews: 5,
});
```

### `secret.update`

Update an existing secret.

**Type**: `Mutation`  
**Auth**: Required (owner only)  
**Input**:

```typescript
{
  id: string;                       // Required
  title?: string;                   // Optional, min 1 char
  description?: string;             // Optional
  content?: string;                 // Optional, min 1 char
  password?: string;                // Optional
  expiresAt?: Date | null;          // Optional, nullable to remove expiration
  deleteAfterView?: boolean;        // Optional
  isPublic?: boolean;               // Optional
  maxViews?: number;                // Optional, positive number
}
```

```typescript
const updateSecret = trpc.secret.update.useMutation();

// Remove expiration from existing secret
updateSecret.mutate({
  id: "secret-id",
  expiresAt: null, // Explicitly remove expiration
});

// Update content and add password
updateSecret.mutate({
  id: "secret-id",
  content: "Updated content",
  password: "new-password",
});
```

**Authorization**: Only the secret owner can update their secrets.

### `secret.delete`

Soft delete a secret (marks as inactive).

**Type**: `Mutation`  
**Auth**: Required (owner only)  
**Input**: `{ id: string }`

```typescript
const deleteSecret = trpc.secret.delete.useMutation({
  onSuccess: () => {
    // Refresh the secrets list
    trpc.useContext().secret.getAll.invalidate();
  },
});

deleteSecret.mutate({ id: "secret-id" });
```

**Note**: This performs a soft delete by setting `isActive: false`. The secret data remains in the database for audit purposes.

### `secret.logAccess`

Log access to a secret and increment view count.

**Type**: `Mutation`  
**Auth**: Not required  
**Input**:

```typescript
{
  secretId: string;
  ipAddress: string;
  userAgent: string;
}
```

```typescript
// Automatically called when viewing a secret
const logAccess = trpc.secret.logAccess.useMutation();

logAccess.mutate({
  secretId: "secret-id",
  ipAddress: "192.168.1.1",
  userAgent: navigator.userAgent,
});
```

**Side Effects**:

- Increments `currentViews` counter
- Creates access log entry
- If `deleteAfterView: true`, marks secret as inactive

### `secret.share`

Share a secret with specific users via email.

**Type**: `Mutation`  
**Auth**: Required (owner only)  
**Input**:

```typescript
{
  secretId: string;
  emails: string[];                 // Array of valid email addresses
  permission: "VIEW" | "DOWNLOAD" | "EDIT";  // Default: "VIEW"
}
```

```typescript
const shareSecret = trpc.secret.share.useMutation();

shareSecret.mutate({
  secretId: "secret-id",
  emails: ["user1@example.com", "user2@example.com"],
  permission: "VIEW",
});
```

**Response**: Array of `SharedSecret` objects with sharing details.

## Error Handling

### Common Error Types

```typescript
// tRPC automatically provides typed errors
const { error } = trpc.secret.getById.useQuery({ id: "invalid-id" });

if (error) {
  switch (error.message) {
    case "Secret not found":
      // Handle missing secret
      break;
    case "Secret has expired":
      // Handle expired secret
      break;
    case "Secret has reached maximum views":
      // Handle view limit exceeded
      break;
    default:
    // Handle other errors
  }
}
```

### Error Response Format

```typescript
{
  message: string; // Human-readable error message
  code: string; // Error code (UNAUTHORIZED, NOT_FOUND, etc.)
  data: {
    code: string; // HTTP status code
    httpStatus: number; // HTTP status number
  }
}
```

## Rate Limiting

### API Rate Limits

| Endpoint           | Limit        | Window | Scope    |
| ------------------ | ------------ | ------ | -------- |
| `secret.create`    | 10 requests  | 1 hour | Per user |
| `secret.update`    | 20 requests  | 1 hour | Per user |
| `secret.getById`   | 100 requests | 1 hour | Per IP   |
| `secret.logAccess` | 50 requests  | 1 hour | Per IP   |

### Rate Limit Responses

When rate limited, APIs return HTTP 429 with retry information:

```typescript
{
  error: "Rate limit exceeded",
  retryAfter: 3600, // Seconds until reset
  limit: 10,        // Request limit
  remaining: 0      // Remaining requests
}
```

## Caching

### Query Caching

tRPC automatically caches query results. You can control caching behavior:

```typescript
// Disable caching for sensitive data
const { data } = trpc.secret.getById.useQuery(
  { id: "secret-id" },
  {
    staleTime: 0, // Always refetch
    cacheTime: 0, // Don't cache
  }
);

// Manual cache invalidation
const utils = trpc.useContext();
utils.secret.getAll.invalidate(); // Refetch all secrets
utils.secret.getById.invalidate({ id: "secret-id" }); // Refetch specific secret
```

### Server-side Caching

Server uses Redis for caching frequently accessed data:

- **Secret metadata**: Cached for 12 hours
- **User sessions**: Cached for 24 hours
- **Rate limit counters**: Cached for limit window duration

## WebSocket Support

### Real-time Updates

tRPC supports WebSocket subscriptions for real-time features (future enhancement):

```typescript
// Example subscription (not yet implemented)
const { data } = trpc.secret.onSecretAccessed.useSubscription({
  secretId: "secret-id",
});
```

## Testing API Endpoints

### Development Testing

Use the built-in API test endpoint:

```bash
# Test Redis connectivity and basic operations
GET http://localhost:3000/api/redis-test

# Test cache operations
POST http://localhost:3000/api/redis-test
Content-Type: application/json

{
  "operation": "set",
  "key": "test-key",
  "value": "test-value"
}
```

### Integration Testing

```typescript
// Example test using tRPC testing utilities
import { createTRPCMsw } from "msw-trpc";
import { appRouter } from "@/server/api/root";

const trpcMsw = createTRPCMsw(appRouter);

// Mock successful secret creation
trpcMsw.secret.create.mutation((req, res, ctx) => {
  return res(
    ctx.data({
      id: "test-secret-id",
      title: "Test Secret",
      content: "Test content",
    })
  );
});
```

## Migration and Versioning

### API Versioning

Currently using a single API version. Future versions will be namespaced:

```typescript
// Current
trpc.secret.getAll.useQuery();

// Future versioning
trpc.v1.secret.getAll.useQuery();
trpc.v2.secret.getAll.useQuery();
```

### Schema Evolution

When updating API schemas, ensure backward compatibility:

1. **Additive Changes**: New optional fields are safe
2. **Breaking Changes**: Require version bumps
3. **Deprecation**: Mark old fields as deprecated before removal

## Performance Optimization

### Batching

tRPC automatically batches multiple queries:

```typescript
// These will be batched into a single HTTP request
const secrets = trpc.secret.getAll.useQuery();
const user = trpc.user.getProfile.useQuery();
```

### Lazy Loading

Load data only when needed:

```typescript
const [enabled, setEnabled] = useState(false);

const { data } = trpc.secret.getById.useQuery(
  { id: "secret-id" },
  { enabled } // Only fetch when enabled is true
);
```

This API documentation provides comprehensive coverage of all available endpoints and their usage patterns for the SecureShare application.
