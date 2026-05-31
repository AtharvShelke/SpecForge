import { Suspense } from "react";
import SharedBuildClient from "./SharedBuildClient";

export const dynamic = "force-dynamic";

export default function SharedBuildPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading shared build...</p>
          </div>
        </div>
      }
    >
      <SharedBuildClient />
    </Suspense>
  );
}
