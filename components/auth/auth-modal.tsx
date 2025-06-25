"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Security,
} from "@/lib/mui-components";
import { trpc } from "@/components/providers/trpc-provider";
import { useAuth } from "@/components/providers/auth-provider";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthStep = "login" | "register" | "verify";

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { setAuth } = useAuth();
  const [step, setStep] = useState<AuthStep>("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    verificationCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // tRPC mutations
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setSuccess(data.message);
      setStep("verify");
      setError("");
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.token && data.user) {
        setAuth(data.token, {
          id: data.user.id,
          name: data.user.name || "User",
          email: data.user.email,
        });
        handleClose();
      }
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: (data) => {
      if (data.token && data.user) {
        setAuth(data.token, {
          id: data.user.id,
          name: data.user.name || "User",
          email: data.user.email,
        });
        handleClose();
      }
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const resendMutation = trpc.auth.resendVerificationCode.useMutation({
    onSuccess: (data) => {
      setSuccess(data.message);
      setError("");
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const handleClose = () => {
    setStep("login");
    setFormData({ name: "", email: "", password: "", verificationCode: "" });
    setError("");
    setSuccess("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (step === "login") {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else if (step === "register") {
      registerMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } else if (step === "verify") {
      verifyMutation.mutate({
        email: formData.email,
        code: formData.verificationCode,
      });
    }
  };

  const handleResendCode = () => {
    resendMutation.mutate({ email: formData.email });
  };

  const isLoading =
    registerMutation.isPending ||
    loginMutation.isPending ||
    verifyMutation.isPending ||
    resendMutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        <Security sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
        <Typography variant="h5" component="div">
          {step === "login" && "Sign In"}
          {step === "register" && "Create Account"}
          {step === "verify" && "Verify Email"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {step === "login" && "Welcome back to SecureShare"}
          {step === "register" && "Join SecureShare to create secure secrets"}
          {step === "verify" &&
            "Enter the verification code sent to your email"}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {step === "register" && (
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {(step === "login" || step === "register") && (
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {(step === "login" || step === "register") && (
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
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
          )}

          {step === "verify" && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Check your email <strong>{formData.email}</strong> for a 6-digit
                verification code.
              </Typography>
              <TextField
                fullWidth
                label="Verification Code"
                value={formData.verificationCode}
                onChange={(e) =>
                  setFormData({ ...formData, verificationCode: e.target.value })
                }
                margin="normal"
                required
                inputProps={{ maxLength: 6 }}
                placeholder="123456"
              />
            </>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                {step === "login" && "Sign In"}
                {step === "register" && "Create Account"}
                {step === "verify" && "Verify Email"}
              </>
            )}
          </Button>

          {step === "verify" && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Didn&apos;t receive the code?
              </Typography>
              <Button
                onClick={handleResendCode}
                disabled={resendMutation.isPending}
                variant="text"
                size="small"
              >
                {resendMutation.isPending ? "Sending..." : "Resend Code"}
              </Button>
            </Box>
          )}

          {(step === "login" || step === "register") && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: "center" }}>
                {step === "login" ? (
                  <Typography variant="body2">
                    Don&apos;t have an account?{" "}
                    <Button
                      onClick={() => setStep("register")}
                      variant="text"
                      size="small"
                    >
                      Sign Up
                    </Button>
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    Already have an account?{" "}
                    <Button
                      onClick={() => setStep("login")}
                      variant="text"
                      size="small"
                    >
                      Sign In
                    </Button>
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
