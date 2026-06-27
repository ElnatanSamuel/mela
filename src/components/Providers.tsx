"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "next-themes";
import SessionMonitor from "./auth/SessionMonitor";
import SessionManager from "./auth/SessionManager";
import { ToastContainer } from "./ui/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <SessionMonitor />
        <SessionManager />
        {children}
        <ToastContainer />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
