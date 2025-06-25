"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Security,
  Schedule,
  Visibility,
  Password,
  CheckCircle,
  ContentCopy,
  Share,
  Link,
} from "@/lib/mui-components";
import { useAuth } from "@/components/providers/auth-provider";
import { trpc } from "@/components/providers/trpc-provider";
import AuthModal from "@/components/auth/auth-modal";
import {
  EXPIRATION_OPTIONS,
  DEFAULT_EXPIRATION_DURATION,
} from "@/lib/constants";
import {
  type SecretFormData,
  type SecretFormSettings,
  type CreatedSecret,
  type ExpirationDuration,
  type ExpirationUnit,
  type FormErrors,
} from "@/lib/types";

export default function CreateSecretPage() {
  const { user, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [formData, setFormData] = useState<SecretFormData>({
    title: "",
    content: "",
    password: "",
    maxViews: "",
  });
  const [settings, setSettings] = useState<SecretFormSettings>({
    passwordProtected: false,
    expirationEnabled: false,
    limitViews: false,
  });
  const [expirationDuration, setExpirationDuration] =
    useState<ExpirationDuration>(DEFAULT_EXPIRATION_DURATION);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [createdSecret, setCreatedSecret] = useState<CreatedSecret | null>(
    null
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);

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

  // tRPC mutation for creating secrets
  const createSecretMutation = trpc.secret.create.useMutation({
    onSuccess: (data: { id: string; title: string }) => {
      setSuccessMessage("Secret created successfully!");
      setCreatedSecret(data);
      setShareModalOpen(true);

      // Reset form after successful creation
      setFormData({
        title: "",
        content: "",
        password: "",
        maxViews: "",
      });
      setSettings({
        passwordProtected: false,
        expirationEnabled: false,
        limitViews: false,
      });
      setErrors({});
    },
    onError: (error: { message: string }) => {
      setErrors({ submit: error.message });
      setSuccessMessage("");
    },
  });

  // Check authentication status
  useEffect(() => {
    if (!isLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [user, isLoading]);

  // Show loading or auth modal if not authenticated
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: "background.paper",
            }}
          >
            <Security sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Authentication Required
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in to create and share secure secrets.
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

  const validateForm = () => {
    const newErrors: FormErrors = {};

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
    const submitData: {
      title: string;
      content: string;
      expiresAt?: Date;
      password?: string;
      maxViews?: number;
    } = {
      title: formData.title.trim() || "Untitled Secret",
      content: formData.content.trim(),
    };

    // Add optional fields only if they're enabled and have values
    if (settings.passwordProtected && formData.password) {
      submitData.password = formData.password;
    }

    if (settings.expirationEnabled) {
      submitData.expiresAt = calculateExpirationDate();
    }

    if (settings.limitViews && formData.maxViews) {
      submitData.maxViews = parseInt(formData.maxViews);
    }

    createSecretMutation.mutate(submitData);
  };

  // Generate shareable link
  const getShareableLink = () => {
    if (!createdSecret) return "";
    return `${window.location.origin}/secret/${createdSecret.id}`;
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareableLink());
      setSuccessMessage("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Share via Web Share API
  const shareViaWebShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `SecureShare: ${createdSecret?.title || "Secret"}`,
          text: "I've shared a secure secret with you. Click the link to view it.",
          url: getShareableLink(),
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setCreatedSecret(null);
    setSuccessMessage("");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Security sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Create Secure Secret
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Share sensitive information securely with encryption and access
            controls
          </Typography>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
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
              disabled={createSecretMutation.isPending}
            />

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
              disabled={createSecretMutation.isPending}
            />
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
                      disabled={createSecretMutation.isPending}
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
                    disabled={createSecretMutation.isPending}
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
                        disabled={createSecretMutation.isPending}
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
                            unit: unit as ExpirationUnit,
                          });
                        }}
                        disabled={createSecretMutation.isPending}
                      >
                        {EXPIRATION_OPTIONS.map((option) => (
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
                        disabled={createSecretMutation.isPending}
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
                      inputProps={{ min: 1, max: 100 }}
                      sx={{ mt: 1 }}
                      required
                      error={!!errors.maxViews}
                      helperText={errors.maxViews}
                      disabled={createSecretMutation.isPending}
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
              disabled={createSecretMutation.isPending}
              sx={{
                minWidth: 200,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              {createSecretMutation.isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Creating...
                </>
              ) : (
                "Create Secret"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Share Modal */}
      <Dialog
        open={shareModalOpen}
        onClose={handleCloseShareModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Link color="primary" />
          Secret Created Successfully!
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            Your secret has been created and is ready to share.
          </Alert>

          <Typography variant="h6" gutterBottom>
            Share this secure link:
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              value={getShareableLink()}
              InputProps={{
                readOnly: true,
              }}
              size="small"
            />
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={copyToClipboard} color="primary">
                <ContentCopy />
              </IconButton>
            </Tooltip>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Tooltip title="Share via apps">
                <IconButton onClick={shareViaWebShare} color="primary">
                  <Share />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            💡 <strong>Important:</strong> Anyone with this link can access your
            secret. Share it only with trusted recipients.
          </Typography>

          {settings.passwordProtected && (
            <Alert severity="info" sx={{ mt: 2 }}>
              🔐 This secret is password protected. Don&apos;t forget to share
              the password separately.
            </Alert>
          )}

          {settings.expirationEnabled && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              ⏰ This secret will expire in {expirationDuration.value}{" "}
              {expirationDuration.unit}
            </Alert>
          )}

          {settings.limitViews && formData.maxViews && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              👁️ This secret can only be viewed {formData.maxViews} time(s)
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareModal} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
