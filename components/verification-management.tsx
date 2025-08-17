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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  verificationService,
  type VerificationStatus,
} from "@/lib/services/verification-service";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface VerificationManagementProps {
  userId: string;
}

export function VerificationManagement({
  userId,
}: VerificationManagementProps) {
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      email: { verified: false, verificationSent: false },
      phone: { verified: false, verificationSent: false },
    });
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Phone verification dialog state
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"number" | "code">("number");

  useEffect(() => {
    loadVerificationStatus();
  }, [userId]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const status = await verificationService.getVerificationStatus(userId);
      setVerificationStatus(status);
      if (status.phone.number) {
        setPhoneNumber(status.phone.number);
      }
    } catch (err) {
      console.error("Failed to load verification status:", err);
      setError("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    try {
      setEmailLoading(true);
      setError("");
      setMessage("");

      const result = await verificationService.sendEmailVerification();

      if (result.success) {
        setMessage(result.message);
        setVerificationStatus((prev) => ({
          ...prev,
          email: {
            ...prev.email,
            verificationSent: true,
            lastSentAt: new Date().toISOString(),
          },
        }));
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Email verification error:", err);
      setError("Failed to send email verification");
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePhoneVerification = async () => {
    try {
      setPhoneLoading(true);
      setError("");
      setMessage("");

      if (phoneStep === "number") {
        // Update phone number first
        const updateResult = await verificationService.updatePhoneNumber(
          phoneNumber
        );
        if (!updateResult.success) {
          setError(updateResult.message);
          return;
        }

        // Send verification code
        const result = await verificationService.sendPhoneVerification(
          phoneNumber
        );
        if (result.success) {
          setMessage(result.message);
          setPhoneStep("code");
          setVerificationStatus((prev) => ({
            ...prev,
            phone: {
              ...prev.phone,
              verificationSent: true,
              number: phoneNumber,
              lastSentAt: new Date().toISOString(),
            },
          }));
        } else {
          setError(result.message);
        }
      } else {
        // Verify code
        const result = await verificationService.verifyPhoneCode(
          phoneNumber,
          verificationCode
        );
        if (result.success) {
          setMessage(result.message);
          setPhoneDialogOpen(false);
          setPhoneStep("number");
          setVerificationCode("");
          setVerificationStatus((prev) => ({
            ...prev,
            phone: { ...prev.phone, verified: true },
          }));
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      console.error("Phone verification error:", err);
      setError("Failed to process phone verification");
    } finally {
      setPhoneLoading(false);
    }
  };

  const getStatusIcon = (verified: boolean, verificationSent: boolean) => {
    if (verified) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (verificationSent) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (verified: boolean, verificationSent: boolean) => {
    if (verified) {
      return "Verified";
    } else if (verificationSent) {
      return "Verification Sent";
    } else {
      return "Not Verified";
    }
  };

  const getStatusColor = (verified: boolean, verificationSent: boolean) => {
    if (verified) {
      return "text-green-600";
    } else if (verificationSent) {
      return "text-yellow-600";
    } else {
      return "text-red-600";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Verification
          </CardTitle>
          <CardDescription>Loading verification status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const requirements = verificationService.getVerificationRequirements();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Verification
          </CardTitle>
          <CardDescription>
            Verify your email and phone number for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(message || error) && (
            <Alert
              className={
                error
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }
            >
              {error ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription
                className={error ? "text-red-800" : "text-green-800"}
              >
                {error || message}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Verification */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">Email Verification</div>
                  <div className="text-sm text-muted-foreground">
                    {requirements.email.description}
                  </div>
                  {requirements.email.required && (
                    <div className="text-xs text-red-600 font-medium">
                      Required
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(
                    verificationStatus.email.verified,
                    verificationStatus.email.verificationSent
                  )}
                  <span
                    className={`text-sm font-medium ${getStatusColor(
                      verificationStatus.email.verified,
                      verificationStatus.email.verificationSent
                    )}`}
                  >
                    {getStatusText(
                      verificationStatus.email.verified,
                      verificationStatus.email.verificationSent
                    )}
                  </span>
                </div>
                {!verificationStatus.email.verified && (
                  <Button
                    size="sm"
                    onClick={handleEmailVerification}
                    disabled={emailLoading}
                  >
                    {emailLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        {verificationStatus.email.verificationSent
                          ? "Resend"
                          : "Verify"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Phone Verification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">Phone Verification</div>
                  <div className="text-sm text-muted-foreground">
                    {requirements.phone.description}
                  </div>
                  {requirements.phone.required && (
                    <div className="text-xs text-red-600 font-medium">
                      Required
                    </div>
                  )}
                  {verificationStatus.phone.number && (
                    <div className="text-xs text-gray-500 font-mono">
                      {verificationStatus.phone.number}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(
                    verificationStatus.phone.verified,
                    verificationStatus.phone.verificationSent
                  )}
                  <span
                    className={`text-sm font-medium ${getStatusColor(
                      verificationStatus.phone.verified,
                      verificationStatus.phone.verificationSent
                    )}`}
                  >
                    {getStatusText(
                      verificationStatus.phone.verified,
                      verificationStatus.phone.verificationSent
                    )}
                  </span>
                </div>
                {!verificationStatus.phone.verified && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPhoneDialogOpen(true)}
                    disabled={phoneLoading}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {verificationStatus.phone.number
                      ? "Update & Verify"
                      : "Add Phone"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Production Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Production Notice:</strong> Phone verification is
              currently in development. In production, this will use SMS
              verification through a secure provider.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Phone Verification Dialog */}
      <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phone Verification</DialogTitle>
            <DialogDescription>
              {phoneStep === "number"
                ? "Enter your phone number to receive a verification code"
                : "Enter the verification code sent to your phone"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {phoneStep === "number" ? (
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPhoneDialogOpen(false);
                setPhoneStep("number");
                setVerificationCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePhoneVerification}
              disabled={
                phoneLoading ||
                (phoneStep === "number" ? !phoneNumber : !verificationCode)
              }
            >
              {phoneLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : phoneStep === "number" ? (
                "Send Code"
              ) : (
                "Verify Code"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
