"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircleIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import Confetti from "react-confetti";

export default function CheckoutSuccess() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Set window size for confetti
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial size
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Confetti animation */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.2}
        colors={["#00ff88", "#0088ff", "#ffffff"]}
      />

      <div className="min-h-screen flex items-center justify-center bg-[rgb(10,10,10)] px-4">
        <Card className="glass border-neon-green/50 p-12 max-w-2xl w-full text-center neon-glow">
          <div className="space-y-6">
            <div className="flex justify-center">
              <CheckCircleIcon className="h-20 w-20 text-neon-green animate-pulse" />
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-neon-green to-neon-blue bg-clip-text text-transparent">
              Welcome to VulnWatch AI!
            </h1>

            <p className="text-xl text-gray-300">
              Your subscription has been activated successfully.
            </p>

            <div className="space-y-4 text-gray-400">
              <p>
                We&apos;re setting up your account and scanning infrastructure. 
                You&apos;ll receive an email shortly with your login credentials.
              </p>
              <p>
                Get ready to experience enterprise-grade vulnerability scanning 
                powered by AI.
              </p>
            </div>

            <div className="pt-6 space-y-4">
              <Button 
                size="lg"
                className="bg-neon-green text-black hover:bg-neon-green/90 font-semibold w-full sm:w-auto"
                disabled
              >
                Go to Dashboard
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-sm text-gray-500">
                Dashboard access will be available in your welcome email
              </p>
            </div>

            <div className="pt-8 border-t border-white/10">
              <p className="text-sm text-gray-400">
                Need help getting started?{" "}
                <Link 
                  href="/docs" 
                  className="text-neon-blue hover:text-neon-blue/80 underline"
                >
                  Check our documentation
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}