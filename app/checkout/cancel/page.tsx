import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircleIcon, ArrowLeftIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(10,10,10)] px-4">
      <Card className="glass border-white/20 p-12 max-w-2xl w-full text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <XCircleIcon className="h-20 w-20 text-red-500 opacity-80" />
          </div>

          <h1 className="text-4xl font-bold">
            Checkout Cancelled
          </h1>

          <p className="text-xl text-gray-300">
            Your payment was cancelled. No charges were made.
          </p>

          <div className="space-y-4 text-gray-400">
            <p>
              We understand that now might not be the right time. Your security 
              is important to us, so we&apos;ll keep your seat warm.
            </p>
            <p>
              When you&apos;re ready to protect your applications with VulnWatch AI, 
              we&apos;ll be here.
            </p>
          </div>

          <div className="pt-6 space-y-4">
            <Link href="/">
              <Button 
                size="lg"
                variant="outline"
                className="border-white/20 hover:bg-white/10 w-full sm:w-auto"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>

            <div className="text-sm text-gray-400">
              <p>Have questions about our plans?</p>
              <Link 
                href="/contact" 
                className="text-neon-blue hover:text-neon-blue/80 underline inline-flex items-center gap-1 mt-2"
              >
                <MessageCircleIcon className="h-4 w-4" />
                Chat with our team
              </Link>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Did you experience any issues?{" "}
              <Link 
                href="/support" 
                className="text-neon-green hover:text-neon-green/80 underline"
              >
                Let us know
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}