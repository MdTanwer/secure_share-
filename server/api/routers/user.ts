import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            secrets: {
              where: {
                isActive: true,
              },
            },
            sharedSecrets: true,
          },
        },
      },
    });
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: input,
      });
    }),

  // Get user's shared secrets (secrets shared with them)
  getSharedSecrets: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.sharedSecret.findMany({
      where: {
        OR: [
          {
            userId: ctx.session.user.id,
          },
          {
            email: ctx.session.user.email,
          },
        ],
      },
      include: {
        secret: {
          select: {
            id: true,
            title: true,
            description: true,
            contentType: true,
            fileName: true,
            createdAt: true,
            expiresAt: true,
            maxViews: true,
            currentViews: true,
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        sharedAt: "desc",
      },
    });
  }),

  // Get user's activity/access logs
  getActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.accessLog.findMany({
        where: {
          OR: [
            {
              userId: ctx.session.user.id,
            },
            {
              secret: {
                createdById: ctx.session.user.id,
              },
            },
          ],
        },
        include: {
          secret: {
            select: {
              id: true,
              title: true,
              createdBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          accessedAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // Check if user exists by email (for sharing)
  checkByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      return {
        exists: !!user,
        user,
      };
    }),
});
