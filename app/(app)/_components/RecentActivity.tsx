'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecentActivity() {
    const [activities, setActivities] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        fetch('/api/storefront/live-activity')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setActivities(data)
            })
            .catch(err => console.error('Failed to load live tracking:', err))
    }, []);

    useEffect(() => {
        if (activities.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % activities.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [activities.length]);

    if (activities.length === 0) return null;

    const currentActivity = activities[currentIndex];

    return (
        <div className="bg-slate-50 border-t border-slate-100 py-3 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Clock size={14} /> Live Activity
                </div>
                <div className="relative h-8 w-full max-w-xl flex justify-center items-center overflow-hidden">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={currentActivity.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="absolute flex items-center justify-center text-sm text-slate-700 px-4 py-1.5 bg-white rounded-full shadow-sm border border-slate-200 gap-2 whitespace-nowrap"
                        >
                            <ShoppingBag size={14} className="text-blue-500" />
                            <span><span className="font-semibold text-slate-900">{currentActivity.customerName}</span> just bought {currentActivity.itemsCount} item(s)</span>
                            <span className="hidden sm:inline text-slate-400 font-medium">·</span>
                            <span className="hidden sm:inline font-medium text-slate-800 truncate max-w-[200px]">{currentActivity.topItemName}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
