/**
 * Centralized type definitions for the SecureShare application
 * This file contains all shared types, interfaces, and type utilities
 */

import { type RouterInputs, type RouterOutputs } from "@/lib/trpc";
import { type ExpirationUnit } from "@/lib/constants";

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Base user interface for authentication and user management
 */
export interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Extended user interface with additional fields
 */
export interface UserProfile extends User {
  image?: string;
  createdAt: Date;
  emailVerified: boolean;
}

/**
 * Session user interface for JWT tokens
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Auth token payload for JWT
 */
export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication context type
 */
export interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

// ============================================================================
// SECRET TYPES
// ============================================================================

/**
 * Secret content types
 */
export type SecretContentType = "TEXT" | "FILE";

/**
 * Secret type for UI selections
 */
export type SecretType = "text" | "file";

/**
 * Permission levels for shared secrets
 */
export type SecretPermission = "VIEW" | "DOWNLOAD" | "EDIT";

/**
 * Base secret interface
 */
export interface BaseSecret {
  id: string;
  title: string;
  description?: string;
  content: string;
  contentType: SecretContentType;
  fileName?: string;
  password?: string;
  expiresAt: Date;
  deleteAfterView: boolean;
  isPublic: boolean;
  maxViews?: number;
  currentViews: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

/**
 * Secret with creator information
 */
export interface SecretWithCreator extends BaseSecret {
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Shared secret interface
 */
export interface SharedSecret {
  id: string;
  secretId: string;
  userId?: string;
  email: string;
  permissions: SecretPermission;
  sharedAt: Date;
  secret: Partial<SecretWithCreator>;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Authentication form data
 */
export interface AuthFormData {
  name: string;
  email: string;
  password: string;
  verificationCode: string;
}

/**
 * Secret creation/editing form data
 */
export interface SecretFormData {
  title: string;
  content: string;
  password: string;
  maxViews: string;
}

/**
 * Secret form settings
 */
export interface SecretFormSettings {
  passwordProtected: boolean;
  expirationEnabled: boolean;
  limitViews: boolean;
}

/**
 * Created secret response data
 */
export interface CreatedSecret {
  id: string;
  title: string;
}

// ============================================================================
// EXPIRATION TYPES (Re-export from constants)
// ============================================================================

/**
 * Expiration duration object
 */
export interface ExpirationDuration {
  value: number;
  unit: ExpirationUnit;
}

// ============================================================================
// MODAL & UI TYPES
// ============================================================================

/**
 * Authentication modal step types
 */
export type AuthStep = "login" | "register" | "verify";

/**
 * Modal component props
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Auth modal specific props
 */
export type AuthModalProps = ModalProps;

// ============================================================================
// API TYPES (tRPC Router Types)
// ============================================================================

/**
 * Auth router input types
 */
export type RegisterInput = RouterInputs["auth"]["register"];
export type LoginInput = RouterInputs["auth"]["login"];
export type VerifyEmailInput = RouterInputs["auth"]["verifyEmail"];
export type ResendCodeInput = RouterInputs["auth"]["resendVerificationCode"];

/**
 * Secret router input types
 */
export type CreateSecretInput = RouterInputs["secret"]["create"];
export type UpdateSecretInput = RouterInputs["secret"]["update"];
export type GetSecretInput = RouterInputs["secret"]["getById"];
export type DeleteSecretInput = RouterInputs["secret"]["delete"];
export type LogAccessInput = RouterInputs["secret"]["logAccess"];
export type ShareSecretInput = RouterInputs["secret"]["share"];

/**
 * User router input types
 */
export type UpdateProfileInput = RouterInputs["user"]["updateProfile"];
export type CheckUserByEmailInput = RouterInputs["user"]["checkByEmail"];
export type GetActivityInput = RouterInputs["user"]["getActivity"];

/**
 * Auth router output types
 */
export type RegisterOutput = RouterOutputs["auth"]["register"];
export type LoginOutput = RouterOutputs["auth"]["login"];
export type VerifyEmailOutput = RouterOutputs["auth"]["verifyEmail"];

/**
 * Secret router output types
 */
export type SecretOutput = RouterOutputs["secret"]["getById"];
export type SecretsListOutput = RouterOutputs["secret"]["getAll"];
export type CreateSecretOutput = RouterOutputs["secret"]["create"];

/**
 * User router output types
 */
export type UserProfileOutput = RouterOutputs["user"]["getProfile"];
export type SharedSecretsOutput = RouterOutputs["user"]["getSharedSecrets"];
export type UserActivityOutput = RouterOutputs["user"]["getActivity"];
export type CheckUserOutput = RouterOutputs["user"]["checkByEmail"];

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Form validation errors
 */
export type FormErrors = Record<string, string>;

/**
 * API error response
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract keys of a type that are of a specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Extract string keys only
 */
export type StringKeys<T> = KeysOfType<T, string>;

/**
 * Extract number keys only
 */
export type NumberKeys<T> = KeysOfType<T, number>;

/**
 * Extract boolean keys only
 */
export type BooleanKeys<T> = KeysOfType<T, boolean>;

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Common component props
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props that include loading state
 */
export interface LoadingProps {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Props that include error state
 */
export interface ErrorProps {
  error?: string | null;
  onErrorClear?: () => void;
}

/**
 * Combined loading and error props
 */
export interface AsyncProps extends LoadingProps, ErrorProps {}

// ============================================================================
// DATABASE RELATION TYPES
// ============================================================================

/**
 * Access log entry
 */
export interface AccessLog {
  id: string;
  secretId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  accessedAt: Date;
}

/**
 * Verification code entry
 */
export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// THEME & STYLING TYPES
// ============================================================================

/**
 * Theme mode options
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Color variants
 */
export type ColorVariant =
  | "primary"
  | "secondary"
  | "error"
  | "warning"
  | "info"
  | "success";

/**
 * Size variants
 */
export type SizeVariant = "small" | "medium" | "large";

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort options for secrets
 */
export type SecretSortField =
  | "createdAt"
  | "title"
  | "expiresAt"
  | "currentViews";

/**
 * Filter options for secrets
 */
export interface SecretFilters {
  isExpired?: boolean;
  hasPassword?: boolean;
  contentType?: SecretContentType;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

/**
 * Search and sort options
 */
export interface SearchOptions {
  query?: string;
  sortField?: SecretSortField;
  sortDirection?: SortDirection;
  filters?: SecretFilters;
  pagination?: PaginationOptions;
}

// ============================================================================
// EXPORT ALL CONSTANTS TYPES
// ============================================================================

export type { ExpirationUnit } from "@/lib/constants";
export {
  APP_METADATA,
  MAX_VIEWS_LIMITS,
  DEFAULT_EXPIRATION_DURATION,
  EXPIRATION_OPTIONS,
} from "@/lib/constants";
