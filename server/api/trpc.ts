/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (
  opts?: CreateNextContextOptions | { req: NextRequest }
) => {
  // Get the authorization header from the request
  let authHeader: string | undefined = undefined;

  if (opts && "req" in opts && opts.req) {
    // For App Router with NextRequest
    if (
      "get" in opts.req.headers &&
      typeof opts.req.headers.get === "function"
    ) {
      authHeader = opts.req.headers.get("authorization") || undefined;
    }
    // For Pages Router with IncomingMessage
    else if ("authorization" in opts.req.headers) {
      authHeader = opts.req.headers.authorization as string;
    }
  }

  // Get the user from the JWT token
  const user = getUserFromRequest(authHeader);

  return {
    db,
    user,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE HELPERS
 *
 * These are helper functions and types that help you create your tRPC API.
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user data if they provide
 * a valid token.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the JWT token is valid and guarantees `ctx.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  // Ensure user exists in database
  const dbUser = await ctx.db.user.findUnique({
    where: { id: ctx.user.userId },
  });

  if (!dbUser || !dbUser.emailVerified) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found or email not verified",
    });
  }

  return next({
    ctx: {
      // infers the `user` as non-nullable
      user: ctx.user,
      // Add session-like object for compatibility
      session: {
        user: {
          id: ctx.user.userId,
          email: ctx.user.email,
          name: ctx.user.name,
        },
      },
    },
  });
});
