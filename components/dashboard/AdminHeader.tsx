// components/dashboard/AdminHeader.tsx
'use client';

import React from 'react';
import {
    Search,
    Bell,
    Menu,
    LogOut,
    User,
    Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminHeaderProps {
    onLogout: () => void;
    onMenuClick: () => void;
    title: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout, onMenuClick, title }) => {
    return (
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 lg:px-8 transition-all duration-300 border-b border-zinc-100/50">
            <div className="h-full flex items-center justify-between gap-6">
                
                {/* Left: Mobile Menu + Title */}
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-2 rounded-full hover:bg-zinc-100 lg:hidden text-zinc-500 transition-colors duration-200"
                    >
                        <Menu size={20} strokeWidth={1.5} />
                    </button>
                    <div>
                        <h2 className="text-lg font-semibold text-black tracking-tight">{title}</h2>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    

                    <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block"></div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 pl-2 pr-3 gap-3 hover:bg-zinc-100 rounded-full transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-black/5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center shadow-inner">
                                    <span className="text-[11px] font-semibold text-white tracking-wider">AD</span>
                                </div>
                                <div className="hidden sm:flex flex-col items-start">
                                    <span className="text-[13px] font-semibold text-black leading-none">Admin User</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2 border-zinc-100 shadow-xl rounded-2xl p-2 bg-white/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="px-3 py-2.5">
                                <p className="text-sm font-semibold text-black tracking-tight">Admin </p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-100 my-1" />
                            <DropdownMenuItem
                                onClick={onLogout}
                                className="px-3 py-2.5 gap-2.5 cursor-pointer rounded-xl text-[13px] font-medium text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50 transition-colors"
                            >
                                <LogOut size={16} strokeWidth={1.5} />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};