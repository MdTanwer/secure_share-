import React from "react";
import { Metadata } from "next";
import { Container, Typography, Button, Box, Lock } from "@/lib/mui-components";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SecureShare - Share Secrets Securely",
  description:
    "Share sensitive information securely with time-limited, one-time access controls. Create encrypted secrets with password protection and automatic expiration.",
  keywords: [
    "secure sharing",
    "secret sharing",
    "encrypted messages",
    "password protection",
    "time-limited access",
  ],
  openGraph: {
    title: "SecureShare - Share Secrets Securely",
    description:
      "Share sensitive information securely with time-limited, one-time access controls.",
    type: "website",
  },
};

/**
 * Home page component for SecureShare application
 * Displays the landing page with hero section and features
 */
export default function Home(): React.JSX.Element {
  return (
    <Container maxWidth="lg" component="main">
      {/* Hero Section */}
      <Box
        component="section"
        sx={{ py: 8, textAlign: "center" }}
        aria-labelledby="hero-title"
      >
        <Typography
          id="hero-title"
          variant="h1"
          component="h1"
          gutterBottom
          sx={{
            fontSize: { xs: "2.5rem", md: "3.5rem" },
            fontWeight: 700,
            color: "primary.main",
          }}
        >
          SecureShare
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          color="text.secondary"
          sx={{
            mb: 4,
            maxWidth: 600,
            mx: "auto",
            fontSize: { xs: "1.25rem", md: "1.5rem" },
          }}
        >
          Share sensitive information securely with time-limited, one-time
          access controls
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/create"
            startIcon={<Lock />}
            sx={{
              minWidth: 200,
              py: 1.5,
              px: 4,
              fontSize: "1.1rem",
            }}
            aria-label="Create a new secure secret"
          >
            Create Secret
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
