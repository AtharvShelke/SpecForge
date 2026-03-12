"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Loader2, AlertCircle, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
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
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: LoginFormValues) {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            router.push("/admin");
            router.refresh();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-white font-sans">
            {/* Left Side - Branding (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 bg-zinc-950 text-white flex-col justify-between p-12 relative overflow-hidden">
                {/* Subtle background glow/gradient effect */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] rounded-full bg-zinc-800/20 blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-zinc-800/10 blur-[100px]" />
                </div>

                <div className="relative z-10 flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-zinc-950" />
                    </div>
                    <Link href='/' className="text-xl font-bold tracking-tight">Nexus Hardware</Link>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg">
                    <h1 className="text-4xl font-medium tracking-tight leading-tight text-zinc-100">
                        Manage your infrastructure with precision.
                    </h1>
                    <p className="text-lg text-zinc-400">
                        The enterprise-grade administrative portal for monitoring, deploying, and scaling Nexus systems globally.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-zinc-500 font-medium">
                    &copy; {new Date().getFullYear()} Nexus Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
                <div className="w-full max-w-[400px] space-y-8">
                    {/* Mobile Branding (Visible only on small screens) */}
                    <div className="flex lg:hidden items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-zinc-950">Nexus</span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">Welcome back</h2>
                        <p className="text-sm text-zinc-500">Enter your credentials to access the admin portal.</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900">
                                        Email Address
                                    </label>
                                    <input
                                        {...form.register("email")}
                                        id="email"
                                        type="email"
                                        disabled={loading}
                                        placeholder="admin@nexus.com"
                                        className={cn(
                                            "flex h-11 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
                                            form.formState.errors.email
                                                ? "border-red-500 focus-visible:ring-red-500"
                                                : "border-zinc-200 focus-visible:ring-zinc-950"
                                        )}
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            {form.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="password"
                                            className="text-sm font-medium leading-none text-zinc-900"
                                        >
                                            Password
                                        </label>

                                        <a
                                            href="#"
                                            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                                        >
                                            Forgot password?
                                        </a>
                                    </div>

                                    <div className="relative">
                                        <input
                                            {...form.register("password")}
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            disabled={loading}
                                            placeholder="••••••••"
                                            className={cn(
                                                "flex h-11 w-full rounded-md border bg-transparent px-3 pr-10 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
                                                form.formState.errors.password
                                                    ? "border-red-500 focus-visible:ring-red-500"
                                                    : "border-zinc-200 focus-visible:ring-zinc-950"
                                            )}
                                        />

                                        {/* Toggle button */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {form.formState.errors.password && (
                                        <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            {form.formState.errors.password.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-red-600 leading-snug">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 h-11 w-full shadow-sm"
                            >
                                {loading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                                {loading ? 'Authenticating...' : 'Sign In'}
                            </button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}