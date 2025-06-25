"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Security,
  Warning,
  CheckCircle,
  Timer,
  Lock,
  Error,
} from "@/lib/mui-components";
import { trpc } from "@/components/providers/trpc-provider";

export default function ViewSecretPage() {
  const params = useParams();
  const secretId = params.id as string;

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [secretContent, setSecretContent] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Get secret metadata first
  const {
    data: secret,
    isLoading,
    error,
  } = trpc.secret.getById.useQuery({ id: secretId }, { enabled: !!secretId });

  // Log access mutation
  const logAccessMutation = trpc.secret.logAccess.useMutation();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!secret) return;

    // In a real implementation, password verification would be done server-side
    // For this demo, we'll simulate password verification
    if (secret.password && password !== secret.password) {
      setPasswordError("Incorrect password");
      return;
    }

    // Log the access
    try {
      await logAccessMutation.mutateAsync({
        secretId,
        ipAddress: "client-ip", // In real app, get actual IP
        userAgent: navigator.userAgent,
      });

      setSecretContent(secret.content);
      setIsUnlocked(true);

      // If it's a one-time view, the secret would be deleted server-side
      if (secret.deleteAfterView) {
        // In real implementation, this would be handled by the backend
        console.log("Secret will be deleted after this view");
      }
    } catch (err) {
      console.error("Failed to log access:", err);
    }
  };

  const handleCopyContent = async () => {
    if ((secretContent || secret?.content) && secret) {
      try {
        await navigator.clipboard.writeText(secretContent || secret.content);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy content:", err);
      }
    }
  };

  const isExpired =
    secret?.expiresAt && new Date() > new Date(secret.expiresAt);
  const isMaxViewsReached =
    secret?.maxViews && secret.currentViews >= secret.maxViews;
  const isPasswordProtected = secret?.password;
  const needsPassword = isPasswordProtected && !isUnlocked;

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            textAlign: "center",
          }}
        >
          <Security sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading secure content...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !secret) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Error sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Secret Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            This secret doesn&apos;t exist or has been deleted.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!secret.isActive) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Warning sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Secret Unavailable
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            This secret has been deactivated or deleted.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (isExpired) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Timer sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Secret Expired
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            This secret has expired and is no longer available.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Expired on: {new Date(secret.expiresAt!).toLocaleString()}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (isMaxViewsReached) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Visibility sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            View Limit Reached
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            This secret has reached its maximum number of views and is no longer
            available.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Minimal SecureShare Branding */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Security color="primary" />
            <Typography
              variant="h5"
              color="primary"
              sx={{ fontWeight: "bold" }}
            >
              SecureShare
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Secure Secret Sharing
          </Typography>
        </Box>

        {/* Secret Info Header */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Security color="primary" />
            <Typography variant="h4" component="h1">
              {secret.title}
            </Typography>
          </Box>

          {secret.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {secret.description}
            </Typography>
          )}

          {/* Security Status Chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {secret.expiresAt ? (
              <Chip
                size="small"
                icon={<Timer />}
                label={`Expires: ${new Date(
                  secret.expiresAt
                ).toLocaleString()}`}
                color="warning"
                variant="outlined"
              />
            ) : (
              <Chip
                size="small"
                icon={<Timer />}
                label="No expiry"
                color="success"
                variant="outlined"
              />
            )}
            {secret.password && (
              <Chip
                size="small"
                icon={<Lock />}
                label="Password Protected"
                color="success"
                variant="outlined"
              />
            )}
            {secret.deleteAfterView && (
              <Chip
                size="small"
                icon={<Visibility />}
                label="One-time Access"
                color="error"
                variant="outlined"
              />
            )}
            {secret.maxViews && (
              <Chip
                size="small"
                label={`Views: ${secret.currentViews}/${secret.maxViews}`}
                color="info"
                variant="outlined"
              />
            )}
          </Box>

          {/* Warnings */}
          {secret.deleteAfterView && !isUnlocked && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>One-time access:</strong> This secret will be permanently
              deleted after viewing.
            </Alert>
          )}
        </Paper>

        {/* Password Form or Secret Content */}
        {needsPassword ? (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Enter Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This secret is password protected. Enter the password to view its
              contents.
            </Typography>

            <form onSubmit={handlePasswordSubmit}>
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!password.trim() || logAccessMutation.isPending}
                startIcon={<Lock />}
                fullWidth
              >
                {logAccessMutation.isPending ? "Verifying..." : "View Secret"}
              </Button>
            </form>
          </Paper>
        ) : (
          <Paper sx={{ p: 4 }}>
            {/* Success indicator if just unlocked */}
            {isUnlocked && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <CheckCircle sx={{ mr: 1 }} />
                Access granted! The secret content is displayed below.
              </Alert>
            )}

            {/* Copy success feedback */}
            {copySuccess && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Content copied to clipboard!
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Secret Content
            </Typography>

            <Card sx={{ bgcolor: "grey.50", mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Content:
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleCopyContent}
                    startIcon={<ContentCopy />}
                    variant="outlined"
                  >
                    Copy
                  </Button>
                </Box>

                <Typography
                  variant="body1"
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "monospace",
                    backgroundColor: "white",
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {secretContent || secret.content}
                </Typography>
              </CardContent>
            </Card>

            {secret.deleteAfterView && (
              <Alert severity="error">
                <strong>Important:</strong> This was a one-time secret and has
                now been permanently deleted. Save the content if you need it
                later.
              </Alert>
            )}
          </Paper>
        )}

        {/* Minimal footer */}
        <Box sx={{ textAlign: "center", mt: 4, py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Powered by SecureShare - Secure secret sharing platform
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
