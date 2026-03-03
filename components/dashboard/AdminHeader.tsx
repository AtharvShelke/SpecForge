'use client';

import React from 'react';
import {
    Search,
    Bell,
    Menu,
    LogOut,
    User,
    ChevronDown,
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
import { Separator } from '@/components/ui/separator';

interface AdminHeaderProps {
    onLogout: () => void;
    onMenuClick: () => void;
    title: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout, onMenuClick, title }) => {
    return (
        <header className="h-14 border-b border-zinc-200 bg-white sticky top-0 z-30 px-4 lg:px-6 transition-colors duration-150">
            <div className="h-full flex items-center justify-between gap-4">
                {/* Left: Menu + Title */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onMenuClick}
                        className="p-1.5 -ml-1.5 rounded-md hover:bg-zinc-100 lg:hidden text-zinc-600 transition-colors duration-150"
                    >
                        <Menu size={18} />
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-zinc-900 truncate">{title}</h2>
                    </div>
                </div>

                {/* Center: Search */}
                <div className="hidden lg:flex flex-1 max-w-md relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors duration-150 group-focus-within:text-zinc-600" />
                    <Input
                        placeholder="Search..."
                        className="pl-9 h-9 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-indigo-300 focus:ring-indigo-500/20 text-sm rounded-md shadow-none transition-all duration-150"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 bg-white text-[11px] font-medium text-zinc-400">⌘K</kbd>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 relative transition-colors duration-150">
                        <Bell size={16} />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </Button>

                    <Separator orientation="vertical" className="h-6 mx-1 bg-zinc-200" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 pl-2 pr-1.5 gap-2 hover:bg-zinc-100 rounded-md transition-colors duration-150">
                                <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center">
                                    <User size={14} className="text-white" />
                                </div>
                                <div className="hidden xl:flex flex-col items-start">
                                    <span className="text-[13px] font-medium text-zinc-700">Admin</span>
                                </div>
                                <ChevronDown size={12} className="text-zinc-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 mt-1 border-zinc-200 shadow-lg rounded-md p-1">
                            <DropdownMenuLabel className="px-3 py-2">
                                <p className="text-sm font-medium text-zinc-900">Admin</p>
                                <p className="text-xs text-zinc-500 mt-0.5 truncate">admin@nexus.io</p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-100" />
                            <DropdownMenuItem className="px-3 py-2 gap-2 cursor-pointer rounded-sm text-sm">
                                <User size={14} className="text-zinc-500" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-100" />
                            <DropdownMenuItem
                                onClick={onLogout}
                                className="px-3 py-2 gap-2 cursor-pointer rounded-sm text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <LogOut size={14} />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};
