"use client";

import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  InputAdornment,
  Paper,
  Divider,
  CircularProgress,
  Add,
  Search,
  MoreVert,
  ContentCopy,
  Edit,
  Delete,
  Visibility,
  Timer,
  Lock,
  Security,
  Dashboard as DashboardIcon,
} from "@/lib/mui-components";
import Link from "next/link";
import { trpc } from "@/components/providers/trpc-provider";

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSecret, setSelectedSecret] = useState<string | null>(null);

  // Fetch user's secrets
  const {
    data: secrets,
    isLoading,
    error,
    refetch,
  } = trpc.secret.getAll.useQuery();

  // Delete mutation
  const deleteSecretMutation = trpc.secret.delete.useMutation({
    onSuccess: () => {
      refetch();
      setAnchorEl(null);
      setSelectedSecret(null);
    },
  });

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    secretId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedSecret(secretId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSecret(null);
  };

  const handleCopyUrl = async (secretId: string) => {
    const url = `${window.location.origin}/secret/${secretId}`;
    await navigator.clipboard.writeText(url);
    handleMenuClose();
  };

  const handleDeleteSecret = () => {
    if (selectedSecret) {
      deleteSecretMutation.mutate({ id: selectedSecret });
    }
  };

  // Filter secrets based on search term
  const filteredSecrets =
    secrets?.filter(
      (secret) =>
        secret.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        secret.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const getStatusColor = (secret: {
    isActive: boolean;
    expiresAt?: Date | null;
    maxViews?: number | null;
    currentViews: number;
  }) => {
    const now = new Date();
    const expiresAt = secret.expiresAt ? new Date(secret.expiresAt) : null;

    if (!secret.isActive) return "error" as const;
    if (expiresAt && now > expiresAt) return "error" as const;
    if (secret.maxViews && secret.currentViews >= secret.maxViews)
      return "error" as const;
    if (expiresAt && expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000)
      return "warning" as const;
    return "success" as const;
  };

  const getStatusText = (secret: {
    isActive: boolean;
    expiresAt?: Date | null;
    maxViews?: number | null;
    currentViews: number;
  }) => {
    const now = new Date();
    const expiresAt = secret.expiresAt ? new Date(secret.expiresAt) : null;

    if (!secret.isActive) return "Deleted";
    if (expiresAt && now > expiresAt) return "Expired";
    if (secret.maxViews && secret.currentViews >= secret.maxViews)
      return "View limit reached";
    if (expiresAt && expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000)
      return "Expires soon";
    return "Active";
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
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

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Alert severity="error">
            Failed to load secrets. Please try again later.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h3" component="h1">
            Dashboard
          </Typography>
        </Box>

        {/* Actions Bar */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              startIcon={<Add />}
              component={Link}
              href="/create"
              size="large"
            >
              Create New Secret
            </Button>

            <TextField
              placeholder="Search secrets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
            mb: 4,
          }}
        >
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary" gutterBottom>
                {secrets?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Secrets
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {secrets?.filter(
                  (s) =>
                    s.isActive &&
                    (!s.expiresAt || new Date() < new Date(s.expiresAt))
                ).length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Secrets
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {secrets?.reduce((sum, s) => sum + s.currentViews, 0) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Views
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="error.main" gutterBottom>
                {secrets?.filter(
                  (s) => s.expiresAt && new Date() > new Date(s.expiresAt)
                ).length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expired Secrets
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Secrets List */}
        {filteredSecrets.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            {searchTerm ? (
              <>
                <Search sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No secrets found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search terms
                </Typography>
              </>
            ) : (
              <>
                <Security
                  sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  No secrets yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Create your first secret to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  component={Link}
                  href="/create"
                >
                  Create Secret
                </Button>
              </>
            )}
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {filteredSecrets.map((secret) => (
              <Card
                key={secret.id}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ flexGrow: 1, mr: 1 }}
                    >
                      {secret.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/secret/${secret.id}/edit`}
                        title="Edit secret"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, secret.id)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Description */}
                  {secret.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {secret.description.length > 100
                        ? `${secret.description.substring(0, 100)}...`
                        : secret.description}
                    </Typography>
                  )}

                  {/* Status */}
                  <Chip
                    label={getStatusText(secret)}
                    color={getStatusColor(secret)}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  {/* Metadata */}
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                  >
                    {secret.password && (
                      <Chip
                        size="small"
                        icon={<Lock />}
                        label="Password"
                        variant="outlined"
                      />
                    )}
                    {secret.deleteAfterView && (
                      <Chip
                        size="small"
                        icon={<Visibility />}
                        label="One-time"
                        variant="outlined"
                      />
                    )}
                    {secret.expiresAt && (
                      <Chip
                        size="small"
                        icon={<Timer />}
                        label={new Date(secret.expiresAt).toLocaleDateString()}
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Stats */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="caption">
                      Views: {secret.currentViews}
                      {secret.maxViews && `/${secret.maxViews}`}
                    </Typography>
                    <Typography variant="caption">
                      Created: {new Date(secret.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleCopyUrl(selectedSecret!)}>
            <ContentCopy sx={{ mr: 1 }} fontSize="small" />
            Copy URL
          </MenuItem>
          <MenuItem
            onClick={() => window.open(`/secret/${selectedSecret}`, "_blank")}
          >
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            View Secret
          </MenuItem>
          <MenuItem
            component={Link}
            href={`/secret/${selectedSecret}/edit`}
            onClick={handleMenuClose}
          >
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDeleteSecret} sx={{ color: "error.main" }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </Container>
  );
}
