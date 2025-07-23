import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { ShieldIcon } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center space-x-2">
          <ShieldIcon className="w-8 h-8 text-neon-green" />
          <span className="text-xl font-bold text-white">VulnWatch</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <RegisterForm />
      </main>

      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>
    </div>
  );
}