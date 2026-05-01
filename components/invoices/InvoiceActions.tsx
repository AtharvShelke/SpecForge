"use client";

import { useState } from "react";
import { Invoice, InvoiceStatus, InvoiceType } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type ActionType = "SEND" | "PAY" | "CANCEL" | "VOID" | "CREDIT_NOTE";

export function getAvailableActions(status: InvoiceStatus): ActionType[] {
  switch (status) {
    case "DRAFT":
      return ["SEND"];
    case "PENDING":
    case "OVERDUE":
      return ["PAY", "CANCEL"];
    case "PAID":
      return ["CREDIT_NOTE"];
    case "CANCELLED":
    case "REFUNDED":
    case "VOIDED":
    default:
      return [];
  }
}

interface InvoiceActionsProps {
  invoice: Invoice;
  onActionComplete: () => void;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  invoice,
  onActionComplete,
}) => {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(invoice.amountDue.toString());

  const availableActions = getAvailableActions(invoice.status);

  if (availableActions.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Status: {invoice.status}
        </span>
        <span className="text-xs text-zinc-400">
          — No further actions available.
        </span>
      </div>
    );
  }

  const handleAction = async () => {
    if (!activeAction) return;
    setIsSubmitting(true);

    try {
      let endpoint = "";
      let body: any = {};

      switch (activeAction) {
        case "SEND":
          endpoint = `/api/billing/invoices/${invoice.id}/send`;
          break;
        case "PAY":
          endpoint = `/api/billing/invoices/${invoice.id}/pay`;
          body = {
            amount: parseFloat(amount) || invoice.amountDue,
            paymentMethodId: "manual", // default
            notes: reason,
          };
          break;
        case "CANCEL":
          endpoint = `/api/billing/invoices/${invoice.id}/cancel`;
          body = { reason };
          break;
        case "VOID":
          endpoint = `/api/billing/invoices/${invoice.id}/void`;
          body = { reason };
          break;
        case "CREDIT_NOTE":
          endpoint = `/api/billing/invoices/${invoice.id}/credit-note`;
          body = { reason };
          break;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(Object.keys(body).length > 0 && { body: JSON.stringify(body) }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Action failed");
      }

      toast({
        title: "Action successful",
        description: `Action ${activeAction} completed successfully`,
      });
      onActionComplete();
      setActiveAction(null);
      setReason("");
    } catch (err: any) {
      toast({
        title: "Action failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionDetails = (action: ActionType) => {
    switch (action) {
      case "SEND":
        return {
          title: "Send Invoice",
          icon: <Send size={15} />,
          color: "bg-indigo-600 hover:bg-indigo-700 text-white",
        };
      case "PAY":
        return {
          title: "Mark as Paid",
          icon: <CheckCircle2 size={15} />,
          color: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
      case "CANCEL":
        return {
          title: "Cancel Invoice",
          icon: <XCircle size={15} />,
          color:
            "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        };
      case "VOID":
        return {
          title: "Void Invoice",
          icon: <Trash2 size={15} />,
          color: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "CREDIT_NOTE":
        return {
          title: "Create Credit Note",
          icon: <RefreshCcw size={15} />,
          color: "bg-amber-500 hover:bg-amber-600 text-white",
        };
      default:
        return { title: "Action", icon: null, color: "" };
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {availableActions.map((action) => {
        const details = getActionDetails(action);
        return (
          <Button
            key={action}
            size="sm"
            className={`h-9 px-4 gap-2 font-medium text-xs rounded-md transition-all ${details.color}`}
            onClick={() => {
              setActiveAction(action);
              setReason("");
              setAmount(invoice.amountDue.toString());
            }}
          >
            {details.icon} {details.title}
          </Button>
        );
      })}

      <Dialog
        open={!!activeAction}
        onOpenChange={(open) => !open && !isSubmitting && setActiveAction(null)}
      >
        <DialogContent className="sm:max-w-md bg-white">
          {activeAction && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getActionDetails(activeAction).icon}{" "}
                  {getActionDetails(activeAction).title}
                </DialogTitle>
                <DialogDescription>
                  You are about to perform this action on invoice{" "}
                  <span className="font-mono font-semibold text-slate-800">
                    {invoice.invoiceNumber}
                  </span>
                  .
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {activeAction === "PAY" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Payment Amount (INR)
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={0}
                      max={invoice.amountDue}
                      step={0.01}
                      className="border-slate-200"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {activeAction === "PAY"
                      ? "Notes (Optional)"
                      : "Reason / Note (Optional)"}
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter details here..."
                    className="border-slate-200 resize-none min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveAction(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className={getActionDetails(activeAction).color}
                  onClick={handleAction}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
