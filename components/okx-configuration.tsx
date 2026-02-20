"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboardBootstrapCached } from "@/lib/client/dashboard-bootstrap-cache";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface OKXConfigurationProps {
  onConnectionChange?: (isConnected: boolean) => void;
  onCredentialsSaved?: (credentials: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
  }) => void;
}

type SessionUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
};

export function OKXConfiguration({ onConnectionChange, onCredentialsSaved }: OKXConfigurationProps) {
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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);
  const [existingCredentials, setExistingCredentials] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const checkExistingCredentials = async (currentUser?: SessionUser | null) => {
    const activeUser = currentUser || user;
    if (!activeUser) {
      return;
    }

    try {
      const response = await fetch("/api/okx/credentials", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json();

      if (response.ok && payload?.credential) {
        setHasExistingCredentials(true);
        setExistingCredentials(payload.credential);
        setIsConnected(Boolean(payload.credential.is_active));
        setIsEditing(false);
      } else {
        setHasExistingCredentials(false);
        setExistingCredentials(null);
        setIsConnected(false);
        setIsEditing(true);
      }
    } catch {
      setHasExistingCredentials(false);
      setExistingCredentials(null);
      setIsEditing(true);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const payload = await getDashboardBootstrapCached({
          exchange: "okx",
          types: ["profile"],
          minimal: true,
          ttlMs: 60_000,
        });

        if (payload?.user?.id) {
          const bootstrapUser: SessionUser = {
            id: payload.user.id,
            email: payload.user.email ?? undefined,
            user_metadata: payload.user.full_name
              ? { full_name: payload.user.full_name }
              : undefined,
          };
          setUser(bootstrapUser);
          await checkExistingCredentials(bootstrapUser);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  const saveCredentials = async () => {
    if (!credentials.apiKey || !credentials.apiSecret || !credentials.passphrase) {
      setError("All fields are required");
      return;
    }

    if (!user) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/okx/credentials", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          passphrase: credentials.passphrase,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error || "Failed to save credentials");
        return;
      }

      setSuccess("Credentials saved successfully!");
      setIsConnected(true);
      setIsEditing(false);
      setHasExistingCredentials(true);
      await checkExistingCredentials();
      onConnectionChange?.(true);
      onCredentialsSaved?.(credentials);
    } catch (e) {
      setError("An error occurred while saving credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/okx/credentials", {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete credentials");
      }

      setHasExistingCredentials(false);
      setExistingCredentials(null);
      setIsConnected(false);
      setIsEditing(true);
      setCredentials({ apiKey: "", apiSecret: "", passphrase: "" });
      setSuccess("Credentials deleted successfully!");
      onConnectionChange?.(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/okx/cache?exchange=okx", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const payload = await response.json();
        const hasAnyData = Array.isArray(payload?.records) && payload.records.length > 0;
        setSuccess(hasAnyData ? "Connection test successful! Cached data found." : "Credentials are configured. Data sync will occur shortly.");
        setIsConnected(true);
        onConnectionChange?.(true);
      } else {
        setError("Connection test failed. Please check your credentials.");
        setIsConnected(false);
        onConnectionChange?.(false);
      }
    } catch (err) {
      setError("Connection test failed");
      setIsConnected(false);
      onConnectionChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowSecret = (field: keyof typeof showSecrets) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        <span className="text-blue-700 text-sm">Loading authentication...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <span className="text-red-700 text-sm">User not authenticated. Please log in to continue.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {hasExistingCredentials && !isEditing ? (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">OKX Configuration Complete</h3>
                <p className="text-green-700 text-sm">Your API credentials are securely saved and active</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setCredentials({ apiKey: "", apiSecret: "", passphrase: "" });
                  setIsEditing(true);
                }}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Settings className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button onClick={handleDelete} variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">API Key</Label>
              <p className="text-sm text-gray-900 font-mono">{existingCredentials?.api_key_preview || "********"}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Status</Label>
              <p className="text-sm text-green-600 font-medium">{isConnected ? "Active & Connected" : "Configured"}</p>
            </div>
          </div>

          <Button onClick={handleTestConnection} disabled={loading} variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {isEditing && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit OKX Configuration</h3>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setCredentials({ apiKey: "", apiSecret: "", passphrase: "" });
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm font-medium text-gray-700">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showSecrets.apiKey ? "text" : "password"}
                  placeholder="Enter your OKX API Key"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 pr-10"
                />
                <button type="button" onClick={() => toggleShowSecret("apiKey")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showSecrets.apiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret" className="text-sm font-medium text-gray-700">API Secret</Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showSecrets.apiSecret ? "text" : "password"}
                  placeholder="Enter your OKX API Secret"
                  value={credentials.apiSecret}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, apiSecret: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 pr-10"
                />
                <button type="button" onClick={() => toggleShowSecret("apiSecret")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showSecrets.apiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passphrase" className="text-sm font-medium text-gray-700">Passphrase</Label>
              <div className="relative">
                <Input
                  id="passphrase"
                  type={showSecrets.passphrase ? "text" : "password"}
                  placeholder="Enter your OKX API Passphrase"
                  value={credentials.passphrase}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, passphrase: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 pr-10"
                />
                <button type="button" onClick={() => toggleShowSecret("passphrase")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showSecrets.passphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            onClick={saveCredentials}
            disabled={loading || !credentials.apiKey || !credentials.apiSecret || !credentials.passphrase}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : isEditing ? (
              "Update & Test Connection"
            ) : (
              "Save & Test Connection"
            )}
          </Button>
        </>
      )}
    </div>
  );
}
