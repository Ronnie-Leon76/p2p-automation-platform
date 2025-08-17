import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Crown,
  Rocket,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  P2P Automation
                </span>
                <div className="text-xs text-purple-400 font-medium">
                  Enterprise Grade
                </div>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/features"
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 font-medium"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-purple-400 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-all duration-200 font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 font-medium"
              >
                About
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10 h-11 px-6"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-11 px-6">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-green-200">
            <Sparkles className="mr-2 h-4 w-4" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Trading Plan
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Start with our free tier and scale up as you grow. No hidden fees,
            no long-term contracts, and transparent pricing for every feature.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="relative bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-2xl mb-2">
                  Starter
                </CardTitle>
                <CardDescription className="text-gray-300 mb-6">
                  Perfect for individual traders getting started with P2P
                  automation
                </CardDescription>
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">Free</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    1 Exchange Integration
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Up to 5 Active Ads
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Basic Analytics
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Email Support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Community Access
                  </li>
                </ul>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold h-12">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative bg-white/5 border-white/10 backdrop-blur-xl scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                  <Star className="mr-1 h-4 w-4" />
                  Most Popular
                </Badge>
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-20"></div>
              <CardHeader className="relative text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-2xl mb-2">
                  Professional
                </CardTitle>
                <CardDescription className="text-gray-300 mb-6">
                  Ideal for serious traders and small teams scaling their
                  operations
                </CardDescription>
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">$49</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    All 3 Exchange Integrations
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Unlimited Active Ads
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Advanced Analytics & Reports
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    AI-Powered Optimization
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Priority Support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Team Collaboration (5 users)
                  </li>
                </ul>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-12">
                    Start Professional Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-2xl mb-2">
                  Enterprise
                </CardTitle>
                <CardDescription className="text-gray-300 mb-6">
                  For large teams and institutions requiring advanced features
                </CardDescription>
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">$199</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Everything in Professional
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Unlimited Team Members
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Advanced Security Features
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Custom Integrations
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    24/7 Phone & Chat Support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    Dedicated Account Manager
                  </li>
                </ul>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold h-12">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-black/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-300">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Can I change my plan at any time?
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes take effect immediately, and we'll prorate any
                  payments accordingly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Is there a free trial for paid plans?
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Yes, all paid plans come with a 14-day free trial. No credit
                  card required to start your trial.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  We accept all major credit cards, PayPal, and bank transfers
                  for enterprise customers. All payments are processed securely
                  through Stripe.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Do you offer custom enterprise solutions?
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Yes, we offer custom solutions for large enterprises with
                  specific requirements. Contact our sales team to discuss your
                  needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Get Started?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of traders who have transformed their P2P operations
            with our automation platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-2xl shadow-purple-500/25 transition-all duration-200 transform hover:scale-105 h-14 px-8 text-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm transition-all duration-200 h-14 px-8 text-lg"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export const metadata = {
  title: "Pricing - P2P Automation Platform",
  description:
    "Simple, transparent pricing for P2P trading automation. Start free and scale up as you grow with no hidden fees.",
};
