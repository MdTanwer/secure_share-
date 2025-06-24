# tRPC Setup Guide for Secure Share

This guide explains how tRPC is configured in your secure sharing application and how to use it.

## What's Been Set Up

### 🛠️ **tRPC Configuration**

1. **Server Setup** (`server/api/`)

   - `trpc.ts` - Core tRPC configuration with context and procedures
   - `root.ts` - Main router combining all sub-routers
   - `routers/secret.ts` - Secret management endpoints
   - `routers/user.ts` - User management endpoints

2. **Client Setup** (`lib/trpc.ts`)

   - Client configuration for frontend usage
   - Type-safe API hooks

3. **API Route** (`app/api/trpc/[trpc]/route.ts`)

   - Next.js App Router endpoint for tRPC

4. **Provider** (`components/providers/trpc-provider.tsx`)
   - React context provider for tRPC and React Query

## Available API Endpoints

### 🔐 **Secret Router** (`api.secret.*`)

#### Protected Endpoints (Require Authentication)

- `api.secret.getAll.useQuery()` - Get all user's secrets
- `api.secret.create.useMutation()` - Create a new secret
- `api.secret.update.useMutation()` - Update a secret
- `api.secret.delete.useMutation()` - Delete a secret
- `api.secret.share.useMutation()` - Share a secret with users

#### Public Endpoints

- `api.secret.getById.useQuery({ id })` - Get secret by ID
- `api.secret.logAccess.useMutation()` - Log secret access

### 👤 **User Router** (`api.user.*`)

All endpoints are protected (require authentication):

- `api.user.getProfile.useQuery()` - Get current user profile
- `api.user.updateProfile.useMutation()` - Update user profile
- `api.user.getSharedSecrets.useQuery()` - Get secrets shared with user
- `api.user.getActivity.useQuery()` - Get user's activity logs
- `api.user.checkByEmail.useQuery({ email })` - Check if user exists

## Usage Examples

### 1. Setting Up tRPC in Your App

First, wrap your app with the tRPC provider:

```tsx
// app/layout.tsx
import { TRPCProvider } from "@/components/providers/trpc-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

### 2. Using tRPC in Components

```tsx
// components/SecretList.tsx
"use client";

import { trpc } from "@/components/providers/trpc-provider";

export function SecretList() {
  // Query data
  const { data: secrets, isLoading, error } = trpc.secret.getAll.useQuery();

  // Mutations
  const createSecret = trpc.secret.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch secrets
      trpc.useContext().secret.getAll.invalidate();
    },
  });

  const handleCreateSecret = (data: any) => {
    createSecret.mutate({
      title: data.title,
      content: data.content,
      contentType: "TEXT",
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {secrets?.map((secret) => (
        <div key={secret.id}>
          <h3>{secret.title}</h3>
          <p>{secret.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Server-Side Usage

```tsx
// app/dashboard/page.tsx
import { trpc } from "@/server/api/root";

export default async function DashboardPage() {
  // Create a server-side caller
  const caller = trpc.createCaller({
    session: null, // Add session when auth is implemented
    db,
  });

  // Server-side data fetching
  const secrets = await caller.secret.getAll();

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Render secrets */}
    </div>
  );
}
```

## TypeScript Integration

### Type-Safe API Calls

```tsx
import { type RouterInputs, type RouterOutputs } from "@/lib/trpc";

// Input types
type CreateSecretInput = RouterInputs["secret"]["create"];
type UpdateSecretInput = RouterInputs["secret"]["update"];

// Output types
type Secret = RouterOutputs["secret"]["getById"];
type UserProfile = RouterOutputs["user"]["getProfile"];
```

### Custom Hooks

```tsx
// hooks/useSecrets.ts
import { trpc } from "@/components/providers/trpc-provider";

export function useSecrets() {
  const utils = trpc.useContext();

  const secrets = trpc.secret.getAll.useQuery();

  const createSecret = trpc.secret.create.useMutation({
    onSuccess: () => {
      utils.secret.getAll.invalidate();
    },
  });

  const deleteSecret = trpc.secret.delete.useMutation({
    onSuccess: () => {
      utils.secret.getAll.invalidate();
    },
  });

  return {
    secrets: secrets.data,
    isLoading: secrets.isLoading,
    createSecret: createSecret.mutate,
    deleteSecret: deleteSecret.mutate,
    isCreating: createSecret.isLoading,
    isDeleting: deleteSecret.isLoading,
  };
}
```

## Error Handling

```tsx
import { TRPCError } from "@trpc/server";

// In your components
const { data, error } = trpc.secret.getAll.useQuery();

if (error) {
  if (error.data?.code === "UNAUTHORIZED") {
    // Handle unauthorized access
    redirect("/login");
  }

  if (error.data?.zodError) {
    // Handle validation errors
    console.log("Validation errors:", error.data.zodError);
  }
}
```

## Adding New Endpoints

### 1. Create a new router file

```tsx
// server/api/routers/example.ts
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello ${input.name}!`;
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Use ctx.db for database operations
      // Use ctx.session for user info
      return { success: true };
    }),
});
```

### 2. Add to main router

```tsx
// server/api/root.ts
import { exampleRouter } from "@/server/api/routers/example";

export const appRouter = createTRPCRouter({
  secret: secretRouter,
  user: userRouter,
  example: exampleRouter, // Add your new router
});
```

## Environment Variables

Make sure these are set in your `.env` file:

```env
# Database connection (already configured)
DATABASE_URL="postgresql://..."

# For development logging
NODE_ENV="development"
```

## Security Features

- **Type Safety**: Full TypeScript support across client and server
- **Input Validation**: Automatic validation using Zod schemas
- **Authentication**: Protected procedures require valid sessions
- **Error Handling**: Structured error responses with codes
- **Request Logging**: Development logging for debugging

## Next Steps

1. **Add Authentication**: Integrate with NextAuth.js for session management
2. **Add Middleware**: Implement rate limiting, CORS, etc.
3. **Add Subscriptions**: Use WebSockets for real-time updates
4. **Add File Upload**: Implement file handling endpoints
5. **Add Caching**: Implement Redis or similar for performance

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**

   - Make sure all imports use `@/` alias
   - Check that files are in correct locations

2. **Type errors**

   - Regenerate Prisma client: `npx prisma generate`
   - Restart TypeScript server in your editor

3. **Runtime errors**
   - Check that database is running
   - Verify environment variables are set
   - Check tRPC provider is wrapping your app

### Useful Commands

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (development)
npx prisma migrate reset

# View database
npx prisma studio
```

Your tRPC setup is now complete and ready for development! 🚀
