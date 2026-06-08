import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PCBuilderClient from "./PCBuilderClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PaywallBlocker from "@/components/storefront/PaywallBlocker";

export const dynamic = "force-dynamic";

export default async function PCBuilderPage() {
  let settings = await prisma.paywallSettings.findUnique({
    where: { id: "paywall_config" },
  });

  if (!settings) {
    settings = await prisma.paywallSettings.create({
      data: {
        id: "paywall_config",
        enabled: false,
        price: 150,
      },
    });
  }

  if (settings.enabled) {
    const user = await getSessionUser();
    const isBlocked = !user || (user.role !== "ADMIN" && !user.hasPaidPaywall);

    if (isBlocked) {
      return (
        <PaywallBlocker
          isLoggedIn={!!user}
          price={settings.price}
          userEmail={user?.email}
          userName={user?.name}
        />
      );
    }
  }

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