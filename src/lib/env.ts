import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  RESEND_API_KEY: z.string().optional().default(""),
  RESEND_FROM_EMAIL: z
    .string()
    .optional()
    .default("PayTrack <notifications@yourdomain.com>"),
  INNGEST_EVENT_KEY: z.string().optional().default(""),
  INNGEST_SIGNING_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional().default("https://us.i.posthog.com"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
