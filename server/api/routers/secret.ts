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
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            sharedWith: true,
            accessLogs: true,
          },
        },
      },
    });
  }),

  // Get a specific secret by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.secret.findUnique({
        where: {
          id: input.id,
          isActive: true,
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          sharedWith: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    }),

  // Create a new secret
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        content: z.string().min(1),
        contentType: z.enum(["TEXT", "FILE", "IMAGE", "DOCUMENT"]),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        password: z.string().optional(),
        expiresAt: z.date().optional(),
        maxViews: z.number().optional(),
        deleteAfterView: z.boolean().default(false),
        isPublic: z.boolean().default(false),
        allowedEmails: z.array(z.string().email()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.secret.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
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
        expiresAt: z.date().optional(),
        maxViews: z.number().optional(),
        deleteAfterView: z.boolean().optional(),
        isPublic: z.boolean().optional(),
        allowedEmails: z.array(z.string().email()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      return ctx.db.secret.update({
        where: {
          id,
          createdById: ctx.session.user.id, // Ensure user can only update their own secrets
        },
        data: updateData,
      });
    }),

  // Delete a secret (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.secret.update({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
        },
        data: {
          isActive: false,
        },
      });
    }),

  // Increment view count and log access
  logAccess: publicProcedure
    .input(
      z.object({
        secretId: z.string(),
        email: z.string().email().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { secretId, ...logData } = input;

      // Create access log
      await ctx.db.accessLog.create({
        data: {
          secretId,
          userId: ctx.session?.user?.id,
          ...logData,
        },
      });

      // Increment view count
      return ctx.db.secret.update({
        where: {
          id: secretId,
        },
        data: {
          currentViews: {
            increment: 1,
          },
        },
      });
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
