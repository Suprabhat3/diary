import "server-only";

import { Resend } from "resend";

import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, url: string) {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your Diary password",
    text: [
      "Someone asked to reset the password for your Diary.",
      "",
      "Choose a new password here. The link expires in one hour:",
      url,
      "",
      "If you didn't ask for this, you can ignore this email. Your password will stay the same.",
    ].join("\n"),
  });

  if (error) {
    throw new Error(error.message);
  }
}
