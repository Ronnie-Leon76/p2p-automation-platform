"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface OKXConfigurationProps {
  onConnectionChange?: (isConnected: boolean) => void;
  onCredentialsSaved?: (credentials: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
  }) => void;
}

export function OKXConfiguration({
  onConnectionChange,
  onCredentialsSaved,
}: OKXConfigurationProps) {
  const [credentials, setCredentials] = useState({
    apiKey: "",
    apiSecret: "",
    passphrase: "",
  });

  const [showSecrets, setShowSecrets] = useState({
    apiKey: false,
    apiSecret: false,
    passphrase: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  // Initialize authentication state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const testConnection = async (
    apiKey: string,
    apiSecret: string,
    passphrase: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/okx/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify-connection",
          apiKey,
          apiSecret,
          passphrase,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.success && result.connected;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  };

  const saveCredentials = async () => {
    console.log("=== SAVE CREDENTIALS DEBUG START ===");
    console.log("Credentials state:", {
      hasApiKey: !!credentials.apiKey,
      hasApiSecret: !!credentials.apiSecret,
      hasPassphrase: !!credentials.passphrase,
      apiKeyLength: credentials.apiKey.length,
      apiSecretLength: credentials.apiSecret.length,
      passphraseLength: credentials.passphrase.length
    });
    
    if (
      !credentials.apiKey ||
      !credentials.apiSecret ||
      !credentials.passphrase
    ) {
      setError("All fields are required");
      console.log("❌ Validation failed: Missing required fields");
      return;
    }

    if (!user) {
      setError("User not authenticated");
      console.log("❌ User not authenticated:", user);
      return;
    }

    console.log("✅ User authenticated:", { id: user.id, email: user.email });
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Current user:", user.id);

      // Ensure user exists in our users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (userCheckError && userCheckError.code === "PGRST116") {
        // User doesn't exist in users table, create it
        console.log("Creating user profile...");
        const { error: createUserError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email || "",
          full_name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          user_type: user.user_metadata?.user_type || "merchant",
          profile_complete: false,
        });

        if (createUserError) {
          console.error("Failed to create user profile:", createUserError);
          setError("Failed to create user profile: " + createUserError.message);
          setLoading(false);
          return;
        }
        console.log("User profile created successfully");
      } else if (userCheckError) {
        console.error("Error checking user:", userCheckError);
        setError("Error checking user: " + userCheckError.message);
        setLoading(false);
        return;
      }

      // Test connection first
      const connectionTest = await testConnection(
        credentials.apiKey,
        credentials.apiSecret,
        credentials.passphrase
      );
      if (!connectionTest) {
        setError(
          "Failed to connect to OKX with provided credentials. Please check your API key, secret, and passphrase."
        );
        setLoading(false);
        return;
      }

      // Save credentials to database
      console.log("Attempting to save credentials to database...");
      console.log("Save payload:", {
        user_id: user.id,
        exchange: "okx",
        api_key: credentials.apiKey.substring(0, 8) + "...",
        api_secret: "***",
        passphrase: "***",
        is_active: true,
      });
      
      const { data, error } = await supabase
        .from("exchange_credentials")
        .upsert({
          user_id: user.id,
          exchange: "okx",
          api_key: credentials.apiKey,
          api_secret: credentials.apiSecret,
          passphrase: credentials.passphrase,
          is_active: true,
        });

      console.log("Supabase save response:", { data, error });

      if (error) {
        console.error("❌ Supabase save error:", error);
        setError(
          "Failed to save credentials: " +
            (error.message || error.details || JSON.stringify(error))
        );
        setLoading(false);
        return;
      }

      console.log("✅ Credentials saved successfully!");
      setSuccess("Credentials saved successfully!");
      setIsConnected(true);

      // Notify parent components
      onConnectionChange?.(true);
      onCredentialsSaved?.(credentials);
      
      console.log("=== SAVE CREDENTIALS DEBUG END ===");
    } catch (error) {
      console.error("Save credentials error:", error);
      setError(
        "An error occurred while saving credentials: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = (
    field: keyof typeof credentials,
    value: string
  ) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const toggleShowSecret = (field: keyof typeof showSecrets) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6">
      {isAuthLoading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <span className="text-blue-700 text-sm">
            Loading authentication...
          </span>
        </div>
      )}

      {!isAuthLoading && !user && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700 text-sm">
            User not authenticated. Please log in to continue.
          </span>
        </div>
      )}

      {!isAuthLoading && user && (
        <>
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="apiKey"
                className="text-sm font-medium text-gray-700"
              >
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showSecrets.apiKey ? "text" : "password"}
                  placeholder="Enter your OKX API Key"
                  value={credentials.apiKey}
                  onChange={(e) =>
                    handleCredentialChange("apiKey", e.target.value)
                  }
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 pr-10 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret("apiKey")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.apiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="apiSecret"
                className="text-sm font-medium text-gray-700"
              >
                API Secret
              </Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showSecrets.apiSecret ? "text" : "password"}
                  placeholder="Enter your OKX API Secret"
                  value={credentials.apiSecret}
                  onChange={(e) =>
                    handleCredentialChange("apiSecret", e.target.value)
                  }
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 pr-10 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret("apiSecret")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.apiSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="passphrase"
                className="text-sm font-medium text-gray-700"
              >
                Passphrase
              </Label>
              <div className="relative">
                <Input
                  id="passphrase"
                  type={showSecrets.passphrase ? "text" : "password"}
                  placeholder="Enter your OKX API Passphrase"
                  value={credentials.passphrase}
                  onChange={(e) =>
                    handleCredentialChange("passphrase", e.target.value)
                  }
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 pr-10 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret("passphrase")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.passphrase ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            onClick={saveCredentials}
            disabled={
              loading ||
              !credentials.apiKey ||
              !credentials.apiSecret ||
              !credentials.passphrase
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Save & Test Connection"
            )}
          </Button>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-700 text-sm font-medium mb-2">
              Getting your OKX API credentials:
            </div>
            <div className="text-blue-600 text-xs space-y-1">
              <div>1. Log in to your OKX account</div>
              <div>2. Go to Account → API Management</div>
              <div>3. Create a new API key with trading permissions</div>
              <div>4. Save the API Key, Secret Key, and Passphrase</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
