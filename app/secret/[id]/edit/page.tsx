"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Security,
  TextFields,
  AttachFile,
  Schedule,
  Visibility,
  Password,
  Save,
  ArrowBack,
} from "@/lib/mui-components";
import { useAuth } from "@/components/providers/auth-provider";
import { trpc } from "@/components/providers/trpc-provider";
import AuthModal from "@/components/auth/auth-modal";
import Link from "next/link";

export default function EditSecretPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const secretId = params.id as string;

  const [secretType, setSecretType] = useState<"text" | "file">("text");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    password: "",
    maxViews: "",
  });
  const [settings, setSettings] = useState({
    passwordProtected: false,
    expirationEnabled: false,
    limitViews: false,
  });
  const [expirationDuration, setExpirationDuration] = useState({
    value: 24,
    unit: "hours" as "minutes" | "hours" | "days" | "months",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Expiration options
  const expirationOptions = [
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
  ];

  // Get secret data
  const {
    data: secret,
    isLoading: secretLoading,
    error: secretError,
  } = trpc.secret.getById.useQuery({ id: secretId }, { enabled: !!secretId });

  // Update mutation
  const updateSecretMutation = trpc.secret.update.useMutation({
    onSuccess: () => {
      setSuccessMessage("Secret updated successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    },
    onError: (error: { message: string }) => {
      setErrors({ submit: error.message });
      setSuccessMessage("");
    },
  });

  // Calculate expiration date based on duration
  const calculateExpirationDate = () => {
    const now = new Date();
    const { value, unit } = expirationDuration;

    switch (unit) {
      case "minutes":
        now.setMinutes(now.getMinutes() + value);
        break;
      case "hours":
        now.setHours(now.getHours() + value);
        break;
      case "days":
        now.setDate(now.getDate() + value);
        break;
      case "months":
        now.setMonth(now.getMonth() + value);
        break;
    }

    return now;
  };

  // Calculate duration from expiration date
  const calculateDurationFromDate = (expiresAt: Date) => {
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { value: 1, unit: "hours" as const };
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return { value: diffMinutes, unit: "minutes" as const };
    } else if (diffHours < 24) {
      return { value: diffHours, unit: "hours" as const };
    } else {
      return { value: diffDays, unit: "days" as const };
    }
  };

  // Load secret data into form when available
  useEffect(() => {
    if (secret) {
      setFormData({
        title: secret.title || "",
        content: secret.content || "",
        password: secret.password || "",
        maxViews: secret.maxViews?.toString() || "",
      });

      setSettings({
        passwordProtected: !!secret.password,
        expirationEnabled: !!secret.expiresAt,
        limitViews: !!secret.maxViews,
      });

      if (secret.expiresAt) {
        const duration = calculateDurationFromDate(new Date(secret.expiresAt));
        setExpirationDuration(duration);
      }

      setSecretType(secret.contentType === "FILE" ? "file" : "text");
    }
  }, [secret]);

  // Check authentication status
  useEffect(() => {
    if (!authLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [user, authLoading]);

  // Check if user owns this secret
  const canEdit = secret && user && secret.createdById === user.id;

  // Show loading or auth modal if not authenticated
  if (authLoading || secretLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper
            elevation={3}
            sx={{ p: 4, textAlign: "center", bgcolor: "background.paper" }}
          >
            <Security sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Authentication Required
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in to edit secrets.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In
            </Button>
          </Paper>
        </Container>
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  if (secretError || !secret) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom color="error">
            Secret Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The secret you&apos;re trying to edit doesn&apos;t exist or has been
            deleted.
          </Typography>
          <Button variant="contained" component={Link} href="/dashboard">
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!canEdit) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom color="error">
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don&apos;t have permission to edit this secret.
          </Typography>
          <Button variant="contained" component={Link} href="/dashboard">
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.content.trim()) {
      newErrors.content = "Secret content is required";
    }

    // Password validation
    if (settings.passwordProtected && !formData.password.trim()) {
      newErrors.password =
        "Password is required when password protection is enabled";
    }

    // Max views validation
    if (settings.limitViews) {
      const maxViews = parseInt(formData.maxViews);
      if (!maxViews || maxViews < 1) {
        newErrors.maxViews = "Maximum views must be at least 1";
      }
      // Don't allow reducing max views below current views
      if (maxViews < secret.currentViews) {
        newErrors.maxViews = `Maximum views cannot be less than current views (${secret.currentViews})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    // Prepare the data for submission
    const updateData: {
      id: string;
      title?: string;
      content?: string;
      expiresAt?: Date;
      password?: string;
      maxViews?: number;
    } = {
      id: secretId,
      title: formData.title.trim() || "Untitled Secret",
      content: formData.content.trim(),
    };

    // Add optional fields only if they're enabled and have values
    if (settings.passwordProtected && formData.password) {
      updateData.password = formData.password;
    } else if (!settings.passwordProtected) {
      updateData.password = "";
    }

    if (settings.expirationEnabled) {
      updateData.expiresAt = calculateExpirationDate();
    }

    if (settings.limitViews && formData.maxViews) {
      updateData.maxViews = parseInt(formData.maxViews);
    } else if (!settings.limitViews) {
      updateData.maxViews = undefined;
    }

    updateSecretMutation.mutate(updateData);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, bgcolor: "background.paper" }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              component={Link}
              href="/dashboard"
              variant="outlined"
            >
              Back to Dashboard
            </Button>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Security sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Edit Secret
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Modify your secret&apos;s content and security settings
            </Typography>
          </Box>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}

        {/* Warning about existing views */}
        {secret.currentViews > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            This secret has been viewed {secret.currentViews} time(s). Changes
            will apply to future access attempts.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Secret Type Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Secret Type
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                icon={<TextFields />}
                label="Text Secret"
                onClick={() => setSecretType("text")}
                color={secretType === "text" ? "primary" : "default"}
                variant={secretType === "text" ? "filled" : "outlined"}
              />
              <Chip
                icon={<AttachFile />}
                label="File Upload"
                onClick={() => setSecretType("file")}
                color={secretType === "file" ? "primary" : "default"}
                variant={secretType === "file" ? "filled" : "outlined"}
                disabled
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              File upload coming soon. Text secrets are available now.
            </Typography>
          </Box>

          {/* Basic Information */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Secret Title (Optional)"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter a descriptive title"
              sx={{ mb: 2 }}
              disabled={updateSecretMutation.isPending}
            />

            {secretType === "text" ? (
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Secret Content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter your secret content here..."
                required
                error={!!errors.content}
                helperText={errors.content}
                disabled={updateSecretMutation.isPending}
              />
            ) : (
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "grey.300",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  bgcolor: "grey.50",
                }}
              >
                <AttachFile sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  File Upload Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  File upload functionality will be available in a future
                  update.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Security Settings */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.passwordProtected}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          passwordProtected: e.target.checked,
                        })
                      }
                      disabled={updateSecretMutation.isPending}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Password />
                      Password Protection
                    </Box>
                  }
                />
                {settings.passwordProtected && (
                  <TextField
                    fullWidth
                    type="password"
                    label="Access Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    sx={{ mt: 1 }}
                    required
                    error={!!errors.password}
                    helperText={errors.password}
                    disabled={updateSecretMutation.isPending}
                  />
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 250 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.expirationEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            expirationEnabled: e.target.checked,
                          })
                        }
                        disabled={updateSecretMutation.isPending}
                      />
                    }
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Schedule />
                        Auto Expiration
                      </Box>
                    }
                  />
                  {settings.expirationEnabled && (
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel>Expires In</InputLabel>
                      <Select
                        value={`${expirationDuration.value}-${expirationDuration.unit}`}
                        label="Expires In"
                        onChange={(e) => {
                          const [value, unit] = e.target.value.split("-");
                          setExpirationDuration({
                            value: parseInt(value),
                            unit: unit as
                              | "minutes"
                              | "hours"
                              | "days"
                              | "months",
                          });
                        }}
                        disabled={updateSecretMutation.isPending}
                      >
                        {expirationOptions.map((option) => (
                          <MenuItem
                            key={`${option.value}-${option.unit}`}
                            value={`${option.value}-${option.unit}`}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 250 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.limitViews}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            limitViews: e.target.checked,
                          })
                        }
                        disabled={updateSecretMutation.isPending}
                      />
                    }
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Visibility />
                        Limit Views
                      </Box>
                    }
                  />
                  {settings.limitViews && (
                    <TextField
                      fullWidth
                      type="number"
                      label="Maximum Views"
                      value={formData.maxViews}
                      onChange={(e) =>
                        setFormData({ ...formData, maxViews: e.target.value })
                      }
                      inputProps={{ min: secret.currentViews || 1, max: 100 }}
                      sx={{ mt: 1 }}
                      required
                      error={!!errors.maxViews}
                      helperText={
                        errors.maxViews ||
                        `Current views: ${secret.currentViews}`
                      }
                      disabled={updateSecretMutation.isPending}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Submit Button */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={updateSecretMutation.isPending}
              startIcon={
                updateSecretMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  <Save />
                )
              }
              sx={{
                minWidth: 200,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              {updateSecretMutation.isPending ? "Updating..." : "Update Secret"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
