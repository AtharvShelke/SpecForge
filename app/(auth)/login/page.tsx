"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Loader2, AlertCircle, Cpu, Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#fafafa] font-sans selection:bg-zinc-200">
      {/* Left Side - Premium Branding */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 text-white flex-col justify-between p-16 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-zinc-800/30 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-700/20 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <Cpu className="w-6 h-6 text-zinc-950" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Computer Store</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium tracking-wider uppercase">
              Enterprise v3.0
            </span>
            <h1 className="text-5xl font-semibold tracking-tight leading-[1.1] text-white">
              Precision control for <span className="text-zinc-500">modern infra.</span>
            </h1>
          </div>
          <p className="text-lg text-zinc-400 leading-relaxed">
            The professional command center for monitoring and scaling Computer Store clusters with millisecond latency.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-sm text-zinc-500 font-medium">
          <span>&copy; {new Date().getFullYear()} Nexus Inc.</span>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px] transition-all">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10 justify-center">
            <div className="w-9 h-9 bg-zinc-950 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-950">Nexus</span>
          </div>

          <div className="text-center lg:text-left space-y-3 mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Sign In</h2>
            <p className="text-zinc-500 font-medium">Access your enterprise dashboard</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                    Email Address
                  </label>
                  <input
                    {...form.register("email")}
                    type="email"
                    disabled={loading}
                    placeholder="admin@nexus.com"
                    className={cn(
                      "flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-zinc-950/5 shadow-sm",
                      form.formState.errors.email
                        ? "border-red-300 focus:border-red-500"
                        : "border-zinc-200 focus:border-zinc-950"
                    )}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1.5 mt-1 ml-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
                      Password
                    </label>
                    <Link href="#" className="text-xs font-bold text-zinc-400 hover:text-zinc-950 transition-colors">
                      Forgot?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      {...form.register("password")}
                      type={showPassword ? "text" : "password"}
                      disabled={loading}
                      placeholder="••••••••"
                      className={cn(
                        "flex h-12 w-full rounded-xl border bg-white px-4 pr-12 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-zinc-950/5 shadow-sm",
                        form.formState.errors.password
                          ? "border-red-300 focus:border-red-500"
                          : "border-zinc-200 focus:border-zinc-950"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-950 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1.5 mt-1 ml-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-sm font-semibold text-red-800 leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-950 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-xl shadow-zinc-200"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In to Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-zinc-500 font-medium">
            Don&apos;t have an account?{" "}
            <Link href="/contact" className="text-zinc-950 font-bold hover:underline">
              Contact Sales
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}