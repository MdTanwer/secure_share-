import { Container, Typography, Button, Box, Lock } from "@/lib/mui-components";
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
        </Box>
      </Box>

      {/* Features Section */}
    </Container>
  );
}
