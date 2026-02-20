"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;
  href: string;
  icon: any;
}

interface OnboardingStatusResponse {
  hasCredentials: boolean;
  hasExchangeData: boolean;
  profileComplete: boolean;
  preferredExchange?: string;
}

export function UserOnboarding() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/onboarding/status", { cache: "no-store" });
      if (!response.ok) return;
      const status = (await response.json()) as OnboardingStatusResponse;
      const preferredExchange = (status.preferredExchange || "okx").toLowerCase();

      const onboardingSteps: OnboardingStep[] = [
        {
          id: "exchange-setup",
          title: "Configure Exchange API",
          description:
            "Connect your exchange account to enable automated trading",
          completed: Boolean(status.hasCredentials),
          action: "Set up Exchange",
          href: `/auth/${preferredExchange}/setup`,
          icon: Wallet,
        },
        {
          id: "data-sync",
          title: "Sync Exchange Data",
          description: "Import your trading data and account information",
          completed: Boolean(status.hasExchangeData),
          action: "Sync Data",
          href: `/dashboard/exchanges/${preferredExchange}`,
          icon: TrendingUp,
        },
        {
          id: "profile-complete",
          title: "Complete Profile",
          description: "Finalize your trader profile and preferences",
          completed: Boolean(status.profileComplete),
          action: "Complete Profile",
          href: "/dashboard/profile",
          icon: Settings,
        },
      ];

      setSteps(onboardingSteps);

      const completedSteps = onboardingSteps.filter(
        (step) => step.completed
      ).length;
      const percentage = (completedSteps / onboardingSteps.length) * 100;
      setCompletionPercentage(percentage);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-600">
              Checking setup status...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completionPercentage === 100) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Setup Complete!</h3>
              <p className="text-sm text-green-700">
                Your account is fully configured and ready for trading.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle>Complete Your Setup</CardTitle>
            <CardDescription>
              Finish configuring your account to start automated trading
            </CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(completionPercentage)}% Complete</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  step.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    step.completed
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                {!step.completed && (
                  <Button
                    onClick={() => router.push(step.href)}
                    size="sm"
                    className="gap-2"
                  >
                    {step.action}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

