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
  Award,
  Globe,
  Heart,
  Lightbulb,
  MapPin,
  Shield,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
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
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-purple-400 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-all duration-200 font-medium"
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
          <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-200">
            <Heart className="mr-2 h-4 w-4" />
            Our Story & Mission
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Revolutionizing{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              P2P Trading
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            We're building the future of automated P2P trading, empowering
            traders worldwide with institutional-grade technology and unmatched
            reliability.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">
                Our{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Mission
                </span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                To democratize access to advanced trading technology by
                providing institutional-grade P2P automation tools that are
                accessible, reliable, and profitable for traders of all sizes.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                We believe that every trader should have access to the same
                powerful automation capabilities that large institutions use,
                without the complexity or massive costs.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white ml-4">
                      Vision
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    To become the global standard for P2P trading automation,
                    trusted by millions of traders worldwide.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Lightbulb className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white ml-4">
                      Innovation
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    Continuously pushing the boundaries of what's possible with
                    AI-powered trading automation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Values
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The principles that guide everything we do and build
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">
                  Trust & Security
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your security is our top priority. We implement bank-grade
                  security measures to protect your assets and data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Innovation</CardTitle>
                <CardDescription className="text-gray-300">
                  We're constantly innovating and improving our platform with
                  cutting-edge technology and user feedback.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Community</CardTitle>
                <CardDescription className="text-gray-300">
                  We believe in building a strong community of traders who
                  support and learn from each other.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">
                  Customer Success
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your success is our success. We're committed to helping you
                  achieve your trading goals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Excellence</CardTitle>
                <CardDescription className="text-gray-300">
                  We strive for excellence in everything we do, from code
                  quality to customer support.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">
                  Global Impact
                </CardTitle>
                <CardDescription className="text-gray-300">
                  We're building technology that empowers traders globally,
                  breaking down barriers to financial success.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Impact
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The numbers that showcase our growth and the trust our users place
              in us
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                50K+
              </div>
              <div className="text-gray-400 text-lg">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                $2B+
              </div>
              <div className="text-gray-400 text-lg">Volume Traded</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                99.9%
              </div>
              <div className="text-gray-400 text-lg">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                150+
              </div>
              <div className="text-gray-400 text-lg">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Meet Our{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Team
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The passionate experts behind P2P Automation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-2xl">JD</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  John Doe
                </h3>
                <p className="text-purple-400 mb-4">CEO & Founder</p>
                <p className="text-gray-300 text-sm">
                  Former Wall Street trader with 15+ years of experience in
                  algorithmic trading and financial technology.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-2xl">SA</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Sarah Anderson
                </h3>
                <p className="text-blue-400 mb-4">CTO</p>
                <p className="text-gray-300 text-sm">
                  AI and machine learning expert with a Ph.D. in Computer
                  Science from MIT. Previously led engineering at top fintech
                  companies.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-2xl">MC</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Michael Chen
                </h3>
                <p className="text-green-400 mb-4">Head of Product</p>
                <p className="text-gray-300 text-sm">
                  Product strategist with deep expertise in user experience
                  design and crypto trading platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Global{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Presence
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              With team members and users across the globe, we're building the
              future of P2P trading from multiple time zones and perspectives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  San Francisco
                </h3>
                <p className="text-gray-400 mb-4">Headquarters</p>
                <p className="text-gray-300 text-sm">
                  Our main office in the heart of Silicon Valley, where
                  innovation meets tradition.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Singapore
                </h3>
                <p className="text-gray-400 mb-4">Asia Pacific Hub</p>
                <p className="text-gray-300 text-sm">
                  Strategic location for serving our growing Asian user base and
                  partnerships.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  London
                </h3>
                <p className="text-gray-400 mb-4">European Operations</p>
                <p className="text-gray-300 text-sm">
                  Our European base for regulatory compliance and regional
                  market expertise.
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
              Join Us?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Be part of the revolution in P2P trading automation. Start your
            journey with the most trusted platform in the industry.
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
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export const metadata = {
  title: "About - P2P Automation Platform",
  description:
    "Learn about our mission to revolutionize P2P trading with institutional-grade automation technology trusted by traders worldwide.",
};
