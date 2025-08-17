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
import { Separator } from "@/components/ui/separator";
import { SecureAuthService } from "@/lib/auth/secure-auth-service";
import { getEnvironmentMode } from "@/lib/config/environment";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  User,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SecureAuthFormProps {
  mode: "signin" | "signup";
}

export function SecureAuthForm({ mode }: SecureAuthFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    userType: "merchant" as "merchant" | "member",
    rememberMe: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const authService = new SecureAuthService();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.email) {
      throw new Error("Email is required");
    }

    if (!formData.password) {
      throw new Error("Password is required");
    }

    if (mode === "signup") {
      if (!formData.fullName) {
        throw new Error("Full name is required");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (formData.password.length < 12) {
        throw new Error("Password must be at least 12 characters long");
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error("Please enter a valid email address");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      validateForm();

      // Debug logging
      console.log(
        `🔍 SecureAuthForm: Mode=${mode}, Environment=${getEnvironmentMode()}, URL=${
          window.location.pathname
        }`
      );

      // Handle real authentication for local/production modes
      console.log(`🔐 Using real authentication: mode=${mode}`);
      if (mode === "signup") {
        const result = await authService.register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          userType: formData.userType,
        });

        if (result.needsEmailVerification) {
          setSuccess(
            "Account created! Please check your email to verify your account, then login."
          );
          // Don't redirect, let user stay to see the message and manually go to login
        } else {
          // Registration successful and no email verification needed
          // Automatically log the user in
          try {
            await authService.login({
              email: formData.email,
              password: formData.password,
              rememberMe: false,
            });

            setSuccess(
              "Account created and logged in successfully! Redirecting to dashboard..."
            );
            setTimeout(() => {
              router.push("/dashboard");
            }, 1500);
          } catch (loginError) {
            // If auto-login fails, show success message and redirect to login
            setSuccess(
              "Account created successfully! Please login with your credentials."
            );
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          }
        }
      } else {
        await authService.login({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        });

        setSuccess("Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      console.error(`${mode} error:`, error);

      // Clear any success messages
      setSuccess("");

      // Set user-friendly error message
      let errorMessage = error.message;

      // Handle network errors
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("Failed to fetch")
      ) {
        setError("Network error. Please check your connection and try again.");
      }
      // Handle specific error cases
      else if (errorMessage.includes("Invalid email or password")) {
        setError(
          "Invalid email or password. If you don't have an account, please sign up first."
        );
      } else if (errorMessage.includes("User already registered")) {
        setError(
          "This email is already registered. Please use the login form below or reset your password if you forgot it."
        );
        // Automatically switch to login mode if user tried to signup with existing email
        if (mode === "signup") {
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
        }
      } else if (errorMessage.includes("Account is temporarily locked")) {
        setError(
          "Account is temporarily locked due to too many failed attempts. Please try again later."
        );
      } else if (errorMessage.includes("verify your email")) {
        setError("Please verify your email address before logging in.");
      } else if (errorMessage.includes("Too many login attempts")) {
        setError(
          "Too many login attempts. Please wait a few minutes before trying again."
        );
      } else if (errorMessage.includes("Password must contain")) {
        setError(errorMessage); // Show password complexity requirements
      } else if (errorMessage.includes("Passwords do not match")) {
        setError(
          "Passwords do not match. Please check your password confirmation."
        );
      } else {
        // Fallback to original error message or generic message
        setError(
          errorMessage ||
            `${
              mode === "signup" ? "Registration" : "Login"
            } failed. Please try again.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentMode = () => {
    return getEnvironmentMode();
  };

  const toggleMode = () => {
    // Convert back to the expected URL format (login/signup)
    if (mode === "signin") {
      router.push("/auth/signup");
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-black/20 backdrop-blur-lg border-white/10 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              {mode === "signup" ? (
                <UserPlus className="h-12 w-12 text-yellow-400" />
              ) : (
                <Shield className="h-12 w-12 text-yellow-400" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {mode === "signup"
                ? "Join the secure P2P automation platform"
                : "Sign in to your secure account"}
            </CardDescription>
            <div className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full inline-block">
              Mode: {getCurrentMode().toUpperCase()}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">
                  {success}
                  {/* Show Go to Login button for email verification case */}
                  {success.includes("check your email") && (
                    <div className="mt-3">
                      <Button
                        onClick={() => router.push("/auth/login")}
                        variant="outline"
                        size="sm"
                        className="bg-green-500/20 border-green-400/50 text-green-300 hover:bg-green-500/30"
                      >
                        Go to Login
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-yellow-400/50 focus:ring-yellow-400/20"
                        required
                      />
                    </div>
                  </div>

                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-white">Account Type</Label>
                    <div className="grid grid-cols-1 gap-3">
                      <div
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          formData.userType === "merchant"
                            ? "border-yellow-400 bg-yellow-400/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                        onClick={() =>
                          handleInputChange("userType", "merchant")
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="userType"
                            value="merchant"
                            checked={formData.userType === "merchant"}
                            onChange={(e) =>
                              handleInputChange("userType", e.target.value)
                            }
                            className="w-4 h-4 text-yellow-400"
                            aria-label="P2P Merchant account type"
                          />
                          <div>
                            <div className="text-white font-medium">
                              P2P Merchant
                            </div>
                            <div className="text-sm text-gray-400">
                              I am a P2P trader who manages operations across
                              multiple exchanges
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          formData.userType === "member"
                            ? "border-yellow-400 bg-yellow-400/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                        onClick={() => handleInputChange("userType", "member")}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="userType"
                            value="member"
                            checked={formData.userType === "member"}
                            onChange={(e) =>
                              handleInputChange("userType", e.target.value)
                            }
                            className="w-4 h-4 text-yellow-400"
                            aria-label="Team Member account type"
                          />
                          <div>
                            <div className="text-white font-medium">
                              Team Member
                            </div>
                            <div className="text-sm text-gray-400">
                              I will be invited to join a merchant's team with
                              specific roles
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-yellow-400/50 focus:ring-yellow-400/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-yellow-400/50 focus:ring-yellow-400/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-yellow-400/50 focus:ring-yellow-400/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {mode !== "signup" && (
                <div className="flex items-center space-x-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      handleInputChange("rememberMe", e.target.checked)
                    }
                    className="w-4 h-4 text-yellow-400 bg-white/5 border-white/10 rounded focus:ring-yellow-400/20"
                    aria-label="Remember me for 30 days"
                  />
                  <Label htmlFor="rememberMe" className="text-white text-sm">
                    Remember me for 30 days
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold py-3 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    {mode === "signup"
                      ? "Creating Account..."
                      : "Signing In..."}
                  </div>
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative">
              <Separator className="bg-white/10" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-gray-400 text-sm">
                or
              </span>
            </div>

            <div className="text-center">
              <button
                onClick={toggleMode}
                className="text-yellow-400 hover:text-yellow-300 transition-colors underline"
              >
                {mode === "signup"
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
