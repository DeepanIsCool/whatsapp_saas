"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !username) {
      router.push("/login");
      return;
    }

    // Set user data from localStorage
    setUser({
      username,
      email: userEmail,
      token,
    });
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.username}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user.whatsappId ? (
                  <span className="text-primary">✓ WhatsApp Connected</span>
                ) : (
                  <span className="text-muted-foreground">
                    WhatsApp Not Connected
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Ready to Get Started
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your WhatsApp SaaS platform is ready. Start by connecting your
                WhatsApp Business API or explore the available features.
              </p>

              {!user.whatsappId && (
                <div className="bg-muted/50 border border-border rounded-lg p-6 max-w-md mx-auto">
                  <h3 className="font-medium text-foreground mb-2">
                    Connect WhatsApp
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your WhatsApp Business API to start sending and
                    receiving messages.
                  </p>
                  <button
                    onClick={() => router.push("/onboarding")}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    Configure WhatsApp →
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
