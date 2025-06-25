import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { theme } from "@/lib/theme";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import Navbar from "@/components/navigation/navbar";
import ConditionalLayout from "@/components/layout/conditional-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecureShare - Share Secrets Securely",
  description:
    "A secure platform for sharing encrypted secrets and files with expiration and access controls.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "100vh",
                }}
              >
                <Navbar />
                <ConditionalLayout>{children}</ConditionalLayout>
              </Box>
            </ThemeProvider>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
