import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import {
  Security,
  Timer,
  Lock,
  Visibility,
  Share,
  Shield,
} from "@mui/icons-material";
import Link from "next/link";

export default function Home() {
  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h1" component="h1" gutterBottom>
          SecureShare
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
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
            sx={{ minWidth: 200 }}
          >
            Create Secret
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            href="/dashboard"
            startIcon={<Shield />}
            sx={{ minWidth: 200 }}
          >
            Dashboard
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Why Choose SecureShare?
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 800, mx: "auto" }}
        >
          Built with security and privacy at its core, SecureShare ensures your
          sensitive information remains protected with enterprise-grade
          features.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Timer sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Time-Limited Access
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set custom expiration times. Secrets automatically
                  self-destruct after the specified duration.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Visibility
                  sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  One-Time Viewing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enable one-time access to ensure secrets can only be viewed
                  once before being permanently deleted.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Security sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Password Protection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add an extra layer of security with optional password
                  protection for your sensitive secrets.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Share sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Easy Sharing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generate unique, shareable URLs that provide secure access to
                  your secrets with just one click.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Shield sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Audit Logging
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track who accessed your secrets and when with comprehensive
                  audit logs and access monitoring.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Lock sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Zero Knowledge
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your secrets are encrypted end-to-end. We never see your data
                  in plain text, ensuring maximum privacy.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* CTA Section */}
      <Paper
        sx={{
          p: 6,
          textAlign: "center",
          mt: 8,
          mb: 4,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Ready to Share Securely?
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
          Start sharing sensitive information with confidence. Create your first
          secret now.
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={Link}
          href="/create"
          sx={{
            bgcolor: "white",
            color: "primary.main",
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          Get Started
        </Button>
      </Paper>
    </Container>
  );
}
