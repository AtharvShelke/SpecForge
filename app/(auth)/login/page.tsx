"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Loader2 } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4 font-sans">
            <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 p-8 sm:p-10">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg shadow-blue-600/20">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="11" width="18" height="10" rx="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Admin Portal</h1>
                    <p className="text-sm text-zinc-500 mt-2">Log in to manage Nexus Hardware</p>
                </div>

                <div className="mt-8">
                    <Form {...form}>
                        {/* Notice: form.handleSubmit requires a plain function matching standard form inputs.
                             We manually wire up our standard raw input styles instead of heavy Component library wrappers to guarantee the specific requested styling. 
                          */}
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider ml-1">Email Address</label>
                                <input
                                    {...form.register("email")}
                                    type="email"
                                    placeholder="admin@nexus.com"
                                    className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                                />
                                {form.formState.errors.email && (
                                    <p className="text-xs text-red-500 font-medium ml-1 mt-1">{form.formState.errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Password</label>
                                </div>
                                <input
                                    {...form.register("password")}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                                />
                                {form.formState.errors.password && (
                                    <p className="text-xs text-red-500 font-medium ml-1 mt-1">{form.formState.errors.password.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 mt-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-red-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" fillOpacity="0.1" /><path d="M12 8V13M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <p className="text-sm font-medium text-red-600 leading-snug">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                            </button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
