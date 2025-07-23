import { CyberBackground } from "@/components/landing/cyber-background";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { StripeCheckout } from "@/components/checkout/stripe-checkout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ShieldCheckIcon, 
  ZapIcon, 
  CodeIcon, 
  GlobeIcon,
  CheckIcon,
  ArrowRightIcon
} from "lucide-react";

export default function Home() {
  return (
    <>
      <CyberBackground />
      <div className="relative min-h-screen">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-32">
          <div className="max-w-6xl mx-auto text-center space-y-8">
            <Badge 
              variant="outline" 
              className="border-neon-green/50 text-neon-green animate-pulse"
            >
              🚀 Now in Beta - Get 50% off
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-neon-green to-neon-blue bg-clip-text text-transparent">
              Automated Vulnerability
              <br />
              Scanning Made Simple
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Enterprise-grade security scanning powered by AI. Continuous monitoring, 
              instant alerts, and actionable insights to keep your applications secure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <StripeCheckout 
                planId="pro"
                className="bg-neon-green text-black hover:bg-neon-green/90 font-semibold neon-glow text-lg px-8 py-6"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </StripeCheckout>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 hover:bg-white/10"
              >
                View Documentation
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400 pt-8">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-neon-green" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-neon-green" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-neon-green" />
                Cancel anytime
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                See VulnWatch in Action
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Experience our lightning-fast vulnerability scanner. Click &quot;Start Scan&quot; 
                to see how we identify security issues in real-time.
              </p>
            </div>
            <InteractiveDemo />
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Enterprise Security, Simplified
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Built on OpenVAS with AI-powered insights to give you the most 
                comprehensive security coverage.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass border-white/10 p-6 hover:border-neon-green/50 transition-colors">
                <ShieldCheckIcon className="h-12 w-12 text-neon-green mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-time Scanning</h3>
                <p className="text-gray-400">
                  Continuous monitoring with instant vulnerability detection and alerts.
                </p>
              </Card>

              <Card className="glass border-white/10 p-6 hover:border-neon-blue/50 transition-colors">
                <ZapIcon className="h-12 w-12 text-neon-blue mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
                <p className="text-gray-400">
                  Smart prioritization and false-positive reduction with machine learning.
                </p>
              </Card>

              <Card className="glass border-white/10 p-6 hover:border-neon-green/50 transition-colors">
                <CodeIcon className="h-12 w-12 text-neon-green mb-4" />
                <h3 className="text-xl font-semibold mb-2">DevOps Integration</h3>
                <p className="text-gray-400">
                  Seamless CI/CD pipeline integration with GitHub, GitLab, and more.
                </p>
              </Card>

              <Card className="glass border-white/10 p-6 hover:border-neon-blue/50 transition-colors">
                <GlobeIcon className="h-12 w-12 text-neon-blue mb-4" />
                <h3 className="text-xl font-semibold mb-2">Compliance Ready</h3>
                <p className="text-gray-400">
                  Built-in compliance reports for SOC2, HIPAA, PCI-DSS, and more.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Simple, Transparent Pricing
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Choose the plan that fits your needs. All plans include core features.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter Plan */}
              <Card className="glass border-white/10 p-8 hover:border-white/20 transition-colors">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Starter</h3>
                  <div className="space-y-1">
                    <p className="text-4xl font-bold">$49<span className="text-lg font-normal text-gray-400">/month</span></p>
                    <p className="text-gray-400">Perfect for small teams</p>
                  </div>
                  <StripeCheckout 
                    planId="starter"
                    className="w-full"
                    variant="outline"
                  />
                  <ul className="space-y-3 pt-4">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Up to 10 applications
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Daily vulnerability scans
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Email alerts
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Basic reporting
                    </li>
                  </ul>
                </div>
              </Card>

              {/* Pro Plan */}
              <Card className="glass border-neon-green/50 p-8 relative neon-glow">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-green text-black">
                  Most Popular
                </Badge>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Pro</h3>
                  <div className="space-y-1">
                    <p className="text-4xl font-bold">$297<span className="text-lg font-normal text-gray-400">/month</span></p>
                    <p className="text-gray-400">For growing businesses</p>
                  </div>
                  <StripeCheckout 
                    planId="pro"
                    className="w-full bg-neon-green text-black hover:bg-neon-green/90"
                  />
                  <ul className="space-y-3 pt-4">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Up to 50 applications
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Real-time scanning
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Slack & webhook alerts
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Advanced analytics
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      API access
                    </li>
                  </ul>
                </div>
              </Card>

              {/* Enterprise Plan */}
              <Card className="glass border-white/10 p-8 hover:border-white/20 transition-colors">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Enterprise</h3>
                  <div className="space-y-1">
                    <p className="text-4xl font-bold">Custom</p>
                    <p className="text-gray-400">Tailored for your needs</p>
                  </div>
                  <StripeCheckout 
                    planId="enterprise"
                    className="w-full"
                    variant="outline"
                  />
                  <ul className="space-y-3 pt-4">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Unlimited applications
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Custom scan frequency
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Dedicated support
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      On-premise deployment
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      Custom integrations
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="glass border-neon-green/50 p-12 max-w-4xl mx-auto text-center neon-glow">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Secure Your Applications?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who trust VulnWatch AI to keep their 
              applications secure. Start your free trial today.
            </p>
            <StripeCheckout 
              planId="pro"
              className="bg-neon-green text-black hover:bg-neon-green/90 font-semibold text-lg px-8 py-6"
            >
              Start Your Free Trial
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </StripeCheckout>
          </Card>
        </section>
      </div>
    </>
  );
}