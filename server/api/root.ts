import { createTRPCRouter } from "@/server/api/trpc";
import { secretRouter } from "@/server/api/routers/secret";
import { userRouter } from "@/server/api/routers/user";
import { authRouter } from "@/server/api/routers/auth";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  secret: secretRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
