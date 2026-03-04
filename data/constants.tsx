import {  OrderStatus, StatusConfig } from "@/types"
import { Banknote, Box, CheckCheck, Clock, RotateCcw, Send, Truck, XCircle } from "lucide-react";

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.PENDING]: {
    label: 'Pending',
    badgeClass: 'bg-zinc-50 text-zinc-600 border-zinc-200',
    dotClass: 'bg-zinc-400',
    icon: <Clock size={12} />,
    description: 'Order placed, awaiting initial action',
  },
  [OrderStatus.PAID]: {
    label: 'Paid',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    icon: <Banknote size={12} />,
    description: 'Payment verified successfully',
  },
  [OrderStatus.PROCESSING]: {
    label: 'Processing',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
    icon: <Box size={12} />,
    description: 'Order being packed',
  },
  [OrderStatus.SHIPPED]: {
    label: 'Shipped',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500',
    icon: <Truck size={12} />,
    description: 'In transit to customer',
  },
  [OrderStatus.DELIVERED]: {
    label: 'Delivered',
    badgeClass: 'bg-zinc-900 text-white border-zinc-900',
    dotClass: 'bg-white',
    icon: <CheckCheck size={12} />,
    description: 'Delivery confirmed',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-400',
    icon: <XCircle size={12} />,
    description: 'Order cancelled',
  },
  [OrderStatus.RETURNED]: {
    label: 'Returned',
    badgeClass: 'bg-zinc-50 text-zinc-500 border-zinc-200',
    dotClass: 'bg-zinc-400',
    icon: <RotateCcw size={12} />,
    description: 'Return processed',
  },
};

export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
};

export const NEXT_STATUS_BUTTON: Record<OrderStatus, { label: string; icon: React.ReactNode; variant: 'default' | 'destructive' | 'outline' | 'secondary' } | null> = {
  [OrderStatus.PENDING]: { label: 'Confirm Payment', icon: <Banknote size={14} />, variant: 'default' },
  [OrderStatus.PAID]: { label: 'Start Processing', icon: <Box size={14} />, variant: 'default' },
  [OrderStatus.PROCESSING]: { label: 'Mark as Shipped', icon: <Send size={14} />, variant: 'default' },
  [OrderStatus.SHIPPED]: { label: 'Mark Delivered', icon: <CheckCheck size={14} />, variant: 'default' },
  [OrderStatus.DELIVERED]: null,
  [OrderStatus.CANCELLED]: null,
  [OrderStatus.RETURNED]: null,
};