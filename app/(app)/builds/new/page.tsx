import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PCBuilderClient from "./PCBuilderClient";

export const dynamic = "force-dynamic";

export default function PCBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      }
    >
      <PCBuilderClient />
    </Suspense>
  );
}