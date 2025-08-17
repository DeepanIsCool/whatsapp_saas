"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthData, setCookie } from "@/lib/cookies";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const [whatsappId, setWhatsappId] = useState("");
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("");
  const [whatsappVerifyToken, setWhatsappVerifyToken] = useState("");
  const [whatsappApiUrl, setWhatsappApiUrl] = useState(
    "https://graph.facebook.com/v19.0"
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUserInfo, setIsCheckingUserInfo] = useState(true);
  const [userHasDetails, setUserHasDetails] = useState(false);
  const router = useRouter();

  // Check if user details are already present
  useEffect(() => {
    const checkUserInfo = async () => {
      try {
        const authData = getAuthData();
        if (!authData.token || !authData.username) {
          setIsCheckingUserInfo(false);
          return;
        }
        const response = await fetch(
          `https://ai.rajatkhandelwal.com/wa/${authData.username}/getuserinfo/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authData.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();

          // Store team information if available
          if (data.teams && data.teams.length > 0) {
            // Find the user's primary team (where they are admin/owner) or use the first team
            const primaryTeam =
              data.teams.find(
                (team: any) => team.role === "ADMIN" || team.role === "OWNER"
              ) || data.teams[0];

            // Update cookies with team information
            setCookie("teamId", primaryTeam.teamId.toString());
            setCookie("teamName", primaryTeam.teamName);
          }

          if (
            data.whatsappId &&
            data.whatsappAccessToken &&
            data.whatsappVerifyToken
          ) {
            // Save WhatsApp config to cookies
            setCookie("whatsappId", data.whatsappId);
            setCookie("whatsappAccessToken", data.whatsappAccessToken);
            setCookie("whatsappVerifyToken", data.whatsappVerifyToken);
            setCookie(
              "whatsappApiUrl",
              data.whatsappApiUrl || "https://graph.facebook.com/v19.0"
            );
            // Redirect to dashboard
            router.push("/dashboard");
            return;
          } else {
            // Pre-fill the form with existing data if partially present
            setUserHasDetails(false);
            setWhatsappId(data.whatsappId || "");
            setWhatsappAccessToken(data.whatsappAccessToken || "");
            setWhatsappVerifyToken(data.whatsappVerifyToken || "");
            setWhatsappApiUrl(
              data.whatsappApiUrl || "https://graph.facebook.com/v19.0"
            );
          }
        } else if (response.status === 401) {
          localStorage.clear();
          router.push("/login");
          return;
        } else {
          console.warn("Could not fetch user info:", response.status);
        }
      } catch (error) {
        console.error("Error checking user info:", error);
      } finally {
        setIsCheckingUserInfo(false);
      }
    };
    checkUserInfo();
  }, [router]);

  // If checking user info, show loading state
  if (isCheckingUserInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Checking your account details...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const updateWhatsAppConfig = async (config: {
    whatsappId: string;
    whatsappAccessToken: string;
    whatsappVerifyToken: string;
    whatsappApiUrl: string;
  }) => {
    try {
      // Get user token from cookies
      const authData = getAuthData();

      if (!authData.token || !authData.username) {
        return { success: false, message: "Authentication required" };
      }

      const response = await fetch(
        `/api/users/${authData.username}/updatewhatsappconfig`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authData.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return {
          success: false,
          message: data.error || "Failed to update configuration",
        };
      }
    } catch (error) {
      return { success: false, message: "Network error occurred" };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!whatsappId || !whatsappAccessToken || !whatsappVerifyToken) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    const response = await updateWhatsAppConfig({
      whatsappId,
      whatsappAccessToken,
      whatsappVerifyToken,
      whatsappApiUrl,
    });

    setIsLoading(false);

    if (response.success) {
      setSuccess(
        userHasDetails
          ? "WhatsApp configuration updated successfully!"
          : "WhatsApp configuration saved successfully!"
      );
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } else {
      setError(response.message);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary-foreground"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">
            {userHasDetails
              ? "Update WhatsApp Configuration"
              : "WhatsApp Configuration"}
          </CardTitle>
          <CardDescription>
            {userHasDetails
              ? "Your WhatsApp Business API is already configured. You can update the settings below or proceed to dashboard."
              : "Connect your WhatsApp Business API to get started. You can skip this step and configure it later."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userHasDetails && (
            <Alert className="border-primary bg-primary/10 mb-6">
              <AlertDescription className="text-primary">
                ✓ Your WhatsApp configuration is already set up! You can update
                it below or go to your dashboard.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-primary bg-primary/10">
                <AlertDescription className="text-primary">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappId">
                  WhatsApp Business ID{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="whatsappId"
                  placeholder="Enter your WhatsApp Business ID"
                  value={whatsappId}
                  onChange={(e) => setWhatsappId(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappApiUrl">WhatsApp API URL</Label>
                <Input
                  id="whatsappApiUrl"
                  placeholder="API URL"
                  value={whatsappApiUrl}
                  onChange={(e) => setWhatsappApiUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappAccessToken">
                WhatsApp Access Token{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="whatsappAccessToken"
                type="password"
                placeholder="Enter your WhatsApp Access Token"
                value={whatsappAccessToken}
                onChange={(e) => setWhatsappAccessToken(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappVerifyToken">
                WhatsApp Verify Token{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="whatsappVerifyToken"
                type="password"
                placeholder="Enter your WhatsApp Verify Token"
                value={whatsappVerifyToken}
                onChange={(e) => setWhatsappVerifyToken(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">
                How to get your WhatsApp credentials:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Go to the Facebook Developers Console</li>
                <li>2. Create a WhatsApp Business App</li>
                <li>3. Get your Business ID from the app dashboard</li>
                <li>4. Generate access and verify tokens</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading
                  ? userHasDetails
                    ? "Updating Configuration..."
                    : "Saving Configuration..."
                  : userHasDetails
                  ? "Update Configuration"
                  : "Save Configuration"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="flex-1 bg-transparent"
              >
                {userHasDetails ? "Go to Dashboard" : "Skip for Now"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
