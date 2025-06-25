"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Security,
  Add,
  Dashboard,
  Logout,
} from "@/lib/mui-components";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import AuthModal from "@/components/auth/auth-modal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const [isSecretRoute, setIsSecretRoute] = useState(false);

  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    setIsSecretRoute(pathname?.startsWith("/secret/") || false);
  }, [pathname]);

  // Hide navbar on secret viewing routes
  if (isSecretRoute) {
    return null;
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Security sx={{ mr: 2 }} />
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
              fontWeight: "bold",
            }}
          >
            SecureShare
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {user ? (
              <>
                <Button
                  component={Link}
                  href="/create"
                  startIcon={<Add />}
                  variant="contained"
                  sx={{
                    bgcolor: "success.main",
                    "&:hover": { bgcolor: "success.dark" },
                  }}
                >
                  Create Secret
                </Button>

                <Chip
                  avatar={<Avatar>{user.name[0].toUpperCase()}</Avatar>}
                  label={user.name}
                  variant="outlined"
                  onClick={handleUserMenuOpen}
                  sx={{
                    color: "white",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                />

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <Button
                    component={Link}
                    href="/dashboard"
                    startIcon={<Dashboard />}
                    color="inherit"
                  >
                    Dashboard
                  </Button>
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  startIcon={<Add />}
                  variant="contained"
                  sx={{
                    bgcolor: "success.main",
                    "&:hover": { bgcolor: "success.dark" },
                  }}
                >
                  Create Secret
                </Button>

                <Button
                  onClick={() => setAuthModalOpen(true)}
                  color="inherit"
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderColor: "white",
                    },
                  }}
                >
                  Sign In
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
