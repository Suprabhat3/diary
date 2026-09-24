import "server-only";

import { z } from "zod";

/**
 * Validated server environment.
 *
 * Only this module reads `process.env`. Everything else imports from here, so a
 * missing or malformed variable fails loudly at boot instead of at 2am in a
 * Server Action. Marked `server-only`: secrets must never reach the client.
 */
const schema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),

  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `Invalid environment variables:\n${issues}\n\nCopy .env.example to .env.local and fill it in.`,
  );
}

export const env = parsed.data;
