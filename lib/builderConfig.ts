/**
 * lib/builderConfig.ts — Server-side utility for fetching BuilderConfig settings.
 *
 * Used by:
 *  - API routes that need to enforce compatibility rules
 *  - Server components rendering the builder storefront
 *  - The admin builder-config API
 *
 * This is the single read path for BuilderConfig.settings at runtime.
 * Falls back to DEFAULT_BUILDER_SETTINGS if no DB row exists yet.
 */

import { prisma } from "@/lib/prisma";
import { DEFAULT_BUILDER_SETTINGS, BuilderSettings } from "@/types";

// Prevent this file from being bundled in the client
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server side");
}

/** Fetches and returns the active BuilderSettings, merged with defaults. */
export async function getBuilderSettings(): Promise<BuilderSettings> {
  try {
    const config = await (prisma as any).builderConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) return DEFAULT_BUILDER_SETTINGS;

    return {
      ...DEFAULT_BUILDER_SETTINGS,
      ...(config.settings as Partial<BuilderSettings>),
    };
  } catch {
    // DB unavailable — fall back to defaults so the builder still works
    return DEFAULT_BUILDER_SETTINGS;
  }
}
