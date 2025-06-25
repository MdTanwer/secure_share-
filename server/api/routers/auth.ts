import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email";
import { generateToken, hashPassword, verifyPassword } from "@/lib/auth";

export const authRouter = createTRPCRouter({
  // Register user and send verification email
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input;

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

      try {
        // Send verification email
        const emailResult = await sendVerificationEmail(
          email,
          verificationCode
        );

        if (!emailResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send verification email",
          });
        }

        // Store verification code in database
        await ctx.db.verificationCode.create({
          data: {
            email: email.toLowerCase(),
            code: verificationCode,
            expiresAt,
          },
        });

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Store user data temporarily (not verified yet)
        // We'll use a separate field to track verification status
        const user = await ctx.db.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            emailVerified: false,
          },
        });

        return {
          success: true,
          message: "Verification code sent to your email",
          userId: user.id,
        };
      } catch (error) {
        console.error("Registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register user",
        });
      }
    }),

  // Verify email with 6-digit code
  verifyEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6, "Verification code must be 6 digits"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, code } = input;

      // Find the verification code
      const verificationRecord = await ctx.db.verificationCode.findFirst({
        where: {
          email: email.toLowerCase(),
          code,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!verificationRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code",
        });
      }

      try {
        // Mark verification code as used
        await ctx.db.verificationCode.update({
          where: { id: verificationRecord.id },
          data: { used: true },
        });

        // Update user as verified
        const user = await ctx.db.user.update({
          where: { email: email.toLowerCase() },
          data: { emailVerified: true },
        });

        // Generate JWT token
        const token = generateToken({
          id: user.id,
          email: user.email,
          name: user.name,
        });

        return {
          success: true,
          message: "Email verified successfully",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        };
      } catch (error) {
        console.error("Email verification error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify email",
        });
      }
    }),

  // Login user
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;

      // Find user
      const user = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email before logging in",
        });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
      });

      return {
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    }),

  // Resend verification code
  resendVerificationCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Check if user exists
      const user = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is already verified",
        });
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      try {
        // Send verification email
        const emailResult = await sendVerificationEmail(
          email,
          verificationCode
        );

        if (!emailResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send verification email",
          });
        }

        // Store new verification code
        await ctx.db.verificationCode.create({
          data: {
            email: email.toLowerCase(),
            code: verificationCode,
            expiresAt,
          },
        });

        return {
          success: true,
          message: "New verification code sent to your email",
        };
      } catch (error) {
        console.error("Resend verification error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resend verification code",
        });
      }
    }),
});
