function normalizeList(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function requireEnv(name: string, minimumLength = 1) {
  const value = process.env[name]?.trim();

  if (!value || value.length < minimumLength) {
    throw new Error(
      `[Config] Missing required environment variable ${name}.`
    );
  }

  return value;
}

export function getJwtSecret() {
  return requireEnv("JWT_SECRET", 32);
}

export function getAllowedOrigins() {
  return normalizeList(process.env.APP_ALLOWED_ORIGINS);
}

export function getAllowedImageHosts() {
  const hosts = normalizeList(process.env.ALLOWED_IMAGE_HOSTS);

  for (const host of hosts) {
    if (host.includes("*")) {
      throw new Error(
        "[Config] ALLOWED_IMAGE_HOSTS must contain explicit hostnames only."
      );
    }
  }

  return hosts;
}

export function getMailConfig() {
  return {
    host: process.env.SMTP_HOST?.trim() || null,
    port: process.env.SMTP_PORT?.trim() || null,
    user: process.env.SMTP_USER?.trim() || null,
    pass: process.env.SMTP_PASS?.trim() || null,
    from: process.env.SMTP_FROM?.trim() || null,
  };
}

export function isMailConfigured() {
  const config = getMailConfig();

  return Boolean(
    config.host && config.port && config.user && config.pass && config.from
  );
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL?.trim() || null;
}
