/**
 * Centralized constants for the SecureShare application
 */

export type ExpirationUnit = "minutes" | "hours" | "days" | "months";

export interface ExpirationOption {
  value: number;
  unit: ExpirationUnit;
  label: string;
}

/**
 * Available expiration time options for secrets
 */
export const EXPIRATION_OPTIONS: readonly ExpirationOption[] = [
  { value: 5, unit: "minutes", label: "5 minutes" },
  { value: 15, unit: "minutes", label: "15 minutes" },
  { value: 30, unit: "minutes", label: "30 minutes" },
  { value: 1, unit: "hours", label: "1 hour" },
  { value: 3, unit: "hours", label: "3 hours" },
  { value: 6, unit: "hours", label: "6 hours" },
  { value: 12, unit: "hours", label: "12 hours" },
  { value: 24, unit: "hours", label: "1 day" },
  { value: 3, unit: "days", label: "3 days" },
  { value: 7, unit: "days", label: "1 week" },
  { value: 30, unit: "days", label: "1 month" },
  { value: 90, unit: "days", label: "3 months" },
] as const;

/**
 * Default expiration duration
 */
export const DEFAULT_EXPIRATION_DURATION = {
  value: 24,
  unit: "hours" as const,
};

/**
 * Maximum views limits
 */
export const MAX_VIEWS_LIMITS = {
  MIN: 1,
  MAX: 100,
  DEFAULT: 1,
} as const;

/**
 * Application metadata
 */
export const APP_METADATA = {
  NAME: "SecureShare",
  DESCRIPTION:
    "Share sensitive information securely with time-limited, one-time access controls",
  KEYWORDS: [
    "secure sharing",
    "secret sharing",
    "encrypted messages",
    "password protection",
    "time-limited access",
  ],
} as const;
