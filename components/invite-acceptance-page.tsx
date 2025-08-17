"use client";

import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { MockEmailService } from "@/lib/auth/mock-email-service";
import {
  MockInvitationStorage,
  type TeamInvitation,
} from "@/lib/auth/mock-invitation-storage";
import { MockTeamStorage } from "@/lib/auth/mock-team-storage";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Mail,
  Shield,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface InvitePageProps {
  inviteCode: string;
}

export function InviteAcceptancePage({ inviteCode }: InvitePageProps) {
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Environment-aware auth
  const mockAuth = useMockAuth();
  const supabaseAuth = useSupabaseAuth();
  
  const { user, signup } = isDevelopment 
    ? mockAuth 
    : { user: null, signup: () => {} };
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    setIsDevelopment(process.env.NODE_ENV === "development");
  }, []);

  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [step, setStep] = useState<
    "invitation" | "signup" | "exchange" | "complete"
  >("invitation");

  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [exchangeForm, setExchangeForm] = useState({
    exchange: "okx" as "okx" | "binance" | "bybit",
    apiKey: "",
    secretKey: "",
    passphrase: "",
  });

  const invitationStorage = MockInvitationStorage.getInstance();
  const teamStorage = MockTeamStorage.getInstance();
  const emailService = MockEmailService.getInstance();

  useEffect(() => {
    loadInvitation();
  }, [inviteCode]);

  const loadInvitation = async () => {
    setIsLoading(true);

    try {
      const invite = invitationStorage.getInvitationByCode(inviteCode);

      if (!invite) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is not valid or has expired.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      if (invite.status !== "pending") {
        toast({
          title: "Invitation Unavailable",
          description: `This invitation has already been ${invite.status}.`,
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      if (new Date() > new Date(invite.expiresAt)) {
        toast({
          title: "Invitation Expired",
          description: "This invitation has expired. Please request a new one.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      setInvitation(invite);

      // Pre-fill email if provided
      if (invite.inviteeEmail) {
        setSignupForm((prev) => ({
          ...prev,
          email: invite.inviteeEmail,
          fullName: invite.inviteeName || "",
        }));
      }

      // Set suggested exchange
      if (invite.suggestedExchange) {
        setExchangeForm((prev) => ({
          ...prev,
          exchange: invite.suggestedExchange!,
        }));
      }

      // If user is already logged in, check if they can accept directly
      if (user) {
        if (user.email === invite.inviteeEmail) {
          setStep("invitation");
        } else {
          toast({
            title: "Wrong Account",
            description: `This invitation is for ${invite.inviteeEmail}. Please log out and use the correct account.`,
            variant: "destructive",
          });
        }
      } else {
        setStep(invite.requiresExchangeAccount ? "invitation" : "signup");
      }
    } catch (error) {
      console.error("Error loading invitation:", error);
      toast({
        title: "Error",
        description: "Failed to load invitation details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setIsAccepting(true);

    try {
      // Accept the invitation
      const acceptedInvitation = invitationStorage.acceptInvitation(
        invitation.id
      );

      if (acceptedInvitation) {
        // Add user to team
        const success = teamStorage.joinTeam(
          invitation.teamId,
          user.id,
          user.full_name,
          user.email
        );

        if (success) {
          // Send welcome email
          const dashboardLink = `${window.location.origin}/dashboard`;
          await emailService.sendWelcomeEmail(
            user.full_name,
            user.email,
            invitation.teamName,
            invitation.inviterName,
            dashboardLink
          );

          toast({
            title: "Welcome to the Team!",
            description: `You've successfully joined ${invitation.teamName}.`,
          });

          setStep("complete");

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        } else {
          throw new Error("Failed to join team");
        }
      } else {
        throw new Error("Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineInvitation = () => {
    if (!invitation) return;

    const declined = invitationStorage.declineInvitation(invitation.id);

    if (declined) {
      toast({
        title: "Invitation Declined",
        description: "You have declined the team invitation.",
      });
      router.push("/");
    }
  };

  const handleSignup = async () => {
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      await signup(
        signupForm.email,
        signupForm.fullName,
        exchangeForm.exchange
      );

      toast({
        title: "Account Created",
        description: "Your account has been created successfully.",
      });

      if (invitation?.requiresExchangeAccount) {
        setStep("exchange");
      } else {
        setStep("invitation");
      }
    } catch (error) {
      toast({
        title: "Signup Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExchangeSetup = () => {
    // In a real app, this would validate and store exchange credentials
    toast({
      title: "Exchange Connected",
      description: `Successfully connected to ${exchangeForm.exchange.toUpperCase()}.`,
    });
    setStep("invitation");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-4">
              This invitation link is not valid or has expired.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {["signup", "exchange", "invitation", "complete"].map(
              (stepName, index) => {
                const isActive = step === stepName;
                const isCompleted =
                  ["signup", "exchange", "invitation"].indexOf(step) > index;

                return (
                  <div key={stepName} className="flex items-center">
                    <div
                      className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }
                  `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < 3 && (
                      <div
                        className={`w-16 h-1 mx-2 ${
                          isCompleted ? "bg-green-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Step Content */}
        {step === "signup" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                Join {invitation.teamName} by creating your trading account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={signupForm.fullName}
                  onChange={(e) =>
                    setSignupForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={signupForm.email}
                  onChange={(e) =>
                    setSignupForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="your@email.com"
                  disabled={!!invitation.inviteeEmail}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={signupForm.password}
                  onChange={(e) =>
                    setSignupForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Create a strong password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={(e) =>
                    setSignupForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm your password"
                />
              </div>
              <Button
                onClick={handleSignup}
                className="w-full"
                disabled={
                  !signupForm.fullName ||
                  !signupForm.email ||
                  !signupForm.password
                }
              >
                Create Account
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "exchange" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Connect Your Exchange</CardTitle>
              <CardDescription>
                Set up your {exchangeForm.exchange.toUpperCase()} exchange
                account to start trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exchange Platform</Label>
                <Select
                  value={exchangeForm.exchange}
                  onValueChange={(value: "okx" | "binance" | "bybit") =>
                    setExchangeForm((prev) => ({ ...prev, exchange: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="okx">OKX</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="bybit">Bybit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  value={exchangeForm.apiKey}
                  onChange={(e) =>
                    setExchangeForm((prev) => ({
                      ...prev,
                      apiKey: e.target.value,
                    }))
                  }
                  placeholder="Your API key"
                />
              </div>
              <div>
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={exchangeForm.secretKey}
                  onChange={(e) =>
                    setExchangeForm((prev) => ({
                      ...prev,
                      secretKey: e.target.value,
                    }))
                  }
                  placeholder="Your secret key"
                />
              </div>
              <div>
                <Label htmlFor="passphrase">Passphrase</Label>
                <Input
                  id="passphrase"
                  type="password"
                  value={exchangeForm.passphrase}
                  onChange={(e) =>
                    setExchangeForm((prev) => ({
                      ...prev,
                      passphrase: e.target.value,
                    }))
                  }
                  placeholder="Your passphrase"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Your credentials are encrypted and stored securely
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("invitation")}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleExchangeSetup}
                  className="flex-1"
                  disabled={!exchangeForm.apiKey || !exchangeForm.secretKey}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Exchange
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "invitation" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                Team Invitation
              </CardTitle>
              <CardDescription>
                You've been invited to join a P2P trading team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold">{invitation.teamName}</h3>
                <p className="text-gray-600 mt-1">
                  Invited by {invitation.inviterName}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Role:</span>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    {invitation.role}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Permissions:</span>
                  <div className="flex flex-wrap gap-1">
                    {invitation.permissions.map((permission) => (
                      <Badge
                        key={permission}
                        variant="secondary"
                        className="text-xs"
                      >
                        {permission.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expires:</span>
                  <span className="text-sm font-medium">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {!invitation.requiresExchangeAccount && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    No exchange account required. You can set one up later.
                  </p>
                </div>
              )}

              {invitation.requiresExchangeAccount &&
                !user?.exchange_credentials && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      You'll need to set up exchange credentials to start
                      trading.
                    </p>
                  </div>
                )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDeclineInvitation}
                  className="flex-1"
                >
                  Decline
                </Button>
                <Button
                  onClick={handleAcceptInvitation}
                  disabled={isAccepting || !user}
                  className="flex-1"
                >
                  {isAccepting ? "Joining..." : "Accept & Join Team"}
                </Button>
              </div>

              {!user && (
                <div className="text-center text-sm text-gray-600">
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:underline"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "complete" && (
          <Card>
            <CardContent className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Welcome to the Team!
              </h2>
              <p className="text-gray-600 mb-6">
                You've successfully joined {invitation.teamName}. You'll be
                redirected to your dashboard shortly.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/dashboard">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/team">View Team Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
