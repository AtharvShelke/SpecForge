"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Hash, RefreshCw, AlertTriangle, Check, Info } from "lucide-react";
import { apiFetch } from "@/lib/helpers";

interface InvoiceSequenceData {
  id: string;
  currentValue: number;
  updatedAt?: string;
}

/**
 * InvoiceSequenceTab — Admin panel for viewing and resetting the invoice counter.
 *
 * The InvoiceSequence singleton (id = "invoice_seq") drives the auto-incrementing
 * invoice number (e.g. INV-00042). This panel lets admins:
 *   1. View the current counter value
 *   2. Reset it to a specific number (e.g. after data migration)
 *
 * ⚠️ Resetting below the current highest invoice number will cause duplicate
 *    invoice number errors. Always reset upward or to a safe value.
 */
const InvoiceSequenceTab = memo(function InvoiceSequenceTab() {
  const [seq, setSeq] = useState<InvoiceSequenceData | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<InvoiceSequenceData>(
        "/api/admin/invoice-sequence",
      );
      setSeq(data);
      setInputValue(String(data.currentValue));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sequence");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleReset = useCallback(async () => {
    const value = parseInt(inputValue, 10);
    if (isNaN(value) || value < 0) {
      setError("Please enter a valid non-negative integer.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = await apiFetch<InvoiceSequenceData>(
        "/api/admin/invoice-sequence",
        {
          method: "POST",
          body: JSON.stringify({ currentValue: value }),
        },
      );
      setSeq(data);
      setInputValue(String(data.currentValue));
      setConfirmed(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset sequence");
    } finally {
      setSaving(false);
    }
  }, [inputValue]);

  const newValue = parseInt(inputValue, 10);
  const isDecrease =
    seq !== null && !isNaN(newValue) && newValue < seq.currentValue;
  const isUnchanged =
    seq !== null && !isNaN(newValue) && newValue === seq.currentValue;
  const canSave =
    !isNaN(newValue) &&
    newValue >= 0 &&
    !isUnchanged &&
    (!isDecrease || confirmed);

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Hash size={15} className="text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-stone-800 tracking-tight">
              Invoice Sequence Counter
            </h3>
          </div>
          <p className="text-xs text-stone-500 ml-10">
            Controls the auto-incrementing invoice number used for all generated
            invoices (e.g.{" "}
            <span className="font-mono text-stone-600">INV-00042</span>).
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="shrink-0 h-8 w-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-all disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Current value display */}
      {loading ? (
        <div className="h-20 rounded-xl bg-stone-50 border border-stone-100 animate-pulse" />
      ) : (
        <div className="rounded-xl border border-stone-100 bg-stone-50 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
              Current Value
            </p>
            <p className="text-3xl font-black text-stone-800 tabular-nums tracking-tight">
              {seq?.currentValue ?? "—"}
            </p>
            {seq?.updatedAt && (
              <p className="text-[10px] text-stone-400 mt-1">
                Last updated{" "}
                {new Date(seq.updatedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
              Next Invoice
            </p>
            <p className="text-sm font-mono font-bold text-indigo-600">
              INV-{String((seq?.currentValue ?? 0) + 1).padStart(5, "0")}
            </p>
          </div>
        </div>
      )}

      {/* Informational note */}
      <div className="flex gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          The counter increments automatically with each invoice. Use the reset
          below only after a data migration or to skip a range of numbers. The
          system always uses{" "}
          <span className="font-mono">currentValue + 1</span> for the next
          invoice.
        </p>
      </div>

      {/* Reset form */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
        <p className="text-xs font-bold text-stone-700">Reset Counter</p>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">
            New Value
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setConfirmed(false);
              setError(null);
            }}
            className="w-full h-10 px-3 text-sm font-mono border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="e.g. 1000"
            disabled={saving}
          />
          {isUnchanged && !isNaN(newValue) && (
            <p className="text-xs text-stone-400">
              This is already the current value.
            </p>
          )}
        </div>

        {/* Decrease warning + confirmation gate */}
        {isDecrease && (
          <div className="flex gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertTriangle
              size={14}
              className="text-amber-600 mt-0.5 shrink-0"
            />
            <div className="space-y-2">
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                You are decreasing the counter from{" "}
                <span className="font-mono">{seq?.currentValue}</span> to{" "}
                <span className="font-mono">{newValue}</span>. This may cause{" "}
                <strong>duplicate invoice numbers</strong> if invoices already
                exist in this range.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs text-amber-800 font-medium">
                  I understand the risk — proceed with reset
                </span>
              </label>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}

        <button
          type="button"
          onClick={handleReset}
          disabled={saving || !canSave || loading}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-stone-700 active:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saved ? (
            <>
              <Check size={13} />
              Saved
            </>
          ) : saving ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Hash size={13} />
              Reset Counter
            </>
          )}
        </button>
      </div>
    </div>
  );
});

export default InvoiceSequenceTab;
