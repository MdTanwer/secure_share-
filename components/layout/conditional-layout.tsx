"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Box } from "@/lib/mui-components";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSecretRoute, setIsSecretRoute] = useState(false);

  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    setIsSecretRoute(pathname?.startsWith("/secret/") || false);
  }, [pathname]);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        pt: isSecretRoute ? 0 : 8, // No padding on secret routes, 8 for navbar on others
        minHeight: isSecretRoute ? "100vh" : "calc(100vh - 64px)",
      }}
    >
      {children}
    </Box>
  );
}
