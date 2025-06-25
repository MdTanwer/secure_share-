import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const secretRouter = createTRPCRouter({
  // Get all secrets for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.secret.findMany({
      where: {
        createdById: ctx.session.user.id,
        isActive: true, // Only fetch active secrets
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get a specific secret by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const secret = await ctx.db.secret.findUnique({
        where: { id: input.id },
      });

      if (!secret) {
        throw new Error("Secret not found");
      }

      // Check if secret is expired or exceeded max views
      const now = new Date();
      if (secret.expiresAt && now > secret.expiresAt) {
        throw new Error("Secret has expired");
      }

      if (secret.maxViews && secret.currentViews >= secret.maxViews) {
        throw new Error("Secret has reached maximum views");
      }

      if (!secret.isActive) {
        throw new Error("Secret is not active");
      }

      return secret;
    }),

  // Create a new secret
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        content: z.string().min(1),
        contentType: z.enum(["TEXT", "FILE"]).default("TEXT"),
        password: z.string().optional(),
        expiresAt: z.date(),
        deleteAfterView: z.boolean().default(false),
        isPublic: z.boolean().default(false),
        maxViews: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.secret.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
          currentViews: 0,
          isActive: true,
        },
      });
    }),

  // Update a secret
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        content: z.string().min(1).optional(),
        password: z.string().optional(),
        expiresAt: z.date().optional(),
        deleteAfterView: z.boolean().optional(),
        isPublic: z.boolean().optional(),
        maxViews: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const secret = await ctx.db.secret.findUnique({
        where: { id },
      });

      if (!secret || secret.createdById !== ctx.session.user.id) {
        throw new Error("Secret not found or unauthorized");
      }

      return ctx.db.secret.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete a secret (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const secret = await ctx.db.secret.findUnique({
        where: { id: input.id },
      });

      if (!secret || secret.createdById !== ctx.session.user.id) {
        throw new Error("Secret not found or unauthorized");
      }

      return ctx.db.secret.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  // Increment view count and log access
  logAccess: publicProcedure
    .input(
      z.object({
        secretId: z.string(),
        ipAddress: z.string(),
        userAgent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First, increment the view count
      const secret = await ctx.db.secret.update({
        where: { id: input.secretId },
        data: {
          currentViews: { increment: 1 },
        },
      });

      // Log the access
      await ctx.db.accessLog.create({
        data: {
          secretId: input.secretId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          accessedAt: new Date(),
        },
      });

      // If it's a one-time view secret, mark it as inactive
      if (secret.deleteAfterView) {
        await ctx.db.secret.update({
          where: { id: input.secretId },
          data: { isActive: false },
        });
      }

      return { success: true };
    }),

  // Share a secret with users
  share: protectedProcedure
    .input(
      z.object({
        secretId: z.string(),
        emails: z.array(z.string().email()),
        permission: z.enum(["VIEW", "DOWNLOAD", "EDIT"]).default("VIEW"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { secretId, emails, permission } = input;

      // Verify the secret belongs to the user
      const secret = await ctx.db.secret.findUnique({
        where: {
          id: secretId,
          createdById: ctx.session.user.id,
        },
      });

      if (!secret) {
        throw new Error("Secret not found or access denied");
      }

      // Create shared secret entries
      const sharedSecrets = await Promise.all(
        emails.map(async (email) => {
          // Check if user exists
          const user = await ctx.db.user.findUnique({
            where: { email },
          });

          return ctx.db.sharedSecret.create({
            data: {
              secretId,
              userId: user?.id,
              email,
              permissions: permission,
            },
          });
        })
      );

      return sharedSecrets;
    }),
});
