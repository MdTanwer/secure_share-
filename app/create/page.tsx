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
  Chip,
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
} from "@mui/material";
import {
  Security,
  TextFields,
  AttachFile,
  Schedule,
  Visibility,
  Password,
  CheckCircle,
  ContentCopy,
  Share,
  Link as LinkIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/auth-provider";
import { trpc } from "@/components/providers/trpc-provider";
import AuthModal from "@/components/auth/auth-modal";

export default function CreateSecretPage() {
  const { user, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
  const [createdSecret, setCreatedSecret] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
      contentType: "TEXT" | "FILE";
      expiresAt: Date;
      password?: string;
      maxViews?: number;
    } = {
      title: formData.title.trim() || "Untitled Secret",
      content: formData.content.trim(),
      contentType: secretType.toUpperCase() as "TEXT" | "FILE",
      expiresAt: new Date(), // Will be set below
    };

    // Add optional fields only if they're enabled and have values
    if (settings.passwordProtected && formData.password) {
      submitData.password = formData.password;
    }

    if (settings.expirationEnabled) {
      submitData.expiresAt = calculateExpirationDate();
    } else {
      // Set default expiration (24 hours from now)
      const defaultExpiration = new Date();
      defaultExpiration.setHours(defaultExpiration.getHours() + 24);
      submitData.expiresAt = defaultExpiration;
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
              disabled={createSecretMutation.isPending}
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
                disabled={createSecretMutation.isPending}
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
                            unit: unit as
                              | "minutes"
                              | "hours"
                              | "days"
                              | "months",
                          });
                        }}
                        disabled={createSecretMutation.isPending}
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
          <LinkIcon color="primary" />
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
          <Button
            onClick={() =>
              window.open(`/secret/${createdSecret?.id}`, "_blank")
            }
            variant="contained"
          >
            View Secret
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
