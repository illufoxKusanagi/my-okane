import { Resend } from "resend";
import * as Sentry from "@sentry/nuxt";
import { buildResetPasswordUrl } from "~~/server/utils/passwordReset";
import { getEnv } from "~~/server/utils/runtimeEnv";

const DEFAULT_FROM = "My Okane <no-reply@myokane.ariefsatria.my.id>";

let resendClient: Resend | null | undefined;

function getResend(): Resend | null {
  if (resendClient === undefined) {
    let configKey = "";
    try {
      configKey = (useRuntimeConfig().resendApiKey as string) || "";
    } catch {
      // Outside Nuxt context
    }
    const apiKey =
      configKey || getEnv("RESEND_API_KEY") || process.env.RESEND_API_KEY;
    resendClient = apiKey ? new Resend(apiKey) : null;
  }
  return resendClient;
}

/**
 * Sends the password reset link email. Deliberately NEVER throws: callers
 * rely on a uniform response regardless of delivery outcome so failures
 * cannot be used as an account-existence oracle.
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  try {
    const resend = getResend();
    if (!resend) {
      console.error(
        "[email] RESEND_API_KEY is not configured; password reset email not sent.",
      );
      return;
    }

    const appUrl = useRuntimeConfig().appUrl as string;
    if (!appUrl) {
      console.error(
        "[email] NUXT_APP_URL is not configured; password reset email not sent.",
      );
      return;
    }

    const resetUrl = buildResetPasswordUrl(appUrl, token);
    let configFrom = "";
    try {
      configFrom = (useRuntimeConfig().resendFrom as string) || "";
    } catch {
      // Outside Nuxt context
    }
    const from =
      configFrom ||
      getEnv("RESEND_FROM") ||
      process.env.RESEND_FROM ||
      DEFAULT_FROM;

    const result = await resend.emails.send({
      from,
      to: email,
      subject: "Reset your My Okane password",
      text: [
        "Someone requested a password reset for your My Okane account.",
        "",
        `Reset your password (valid for 10 minutes): ${resetUrl}`,
        "",
        "If you did not request this, you can safely ignore this email.",
      ].join("\n"),
      html: `
<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717;">
    <p>Someone requested a password reset for your <strong>My Okane</strong> account.</p>
    <p style="margin: 24px 0;">
      <a href="${resetUrl}"
         style="background: #7c3aed; color: #ffffff; padding: 10px 20px; border-radius: 9999px; text-decoration: none; display: inline-block;">
        Reset password
      </a>
    </p>
    <p>This link expires in <strong>10 minutes</strong> and can only be used once.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  </body>
</html>`.trim(),
    });

    if (result.error) {
      console.error("[email] Resend send failed:", result.error);
      Sentry.captureException(
        new Error("Password reset email delivery failed"),
        {
          tags: { feature: "password-reset-email" },
          extra: { resendError: result.error },
        },
      );
    }
  } catch (err: unknown) {
    console.error("[email] Unexpected password reset email failure:", err);
    Sentry.captureException(err, {
      tags: { feature: "password-reset-email" },
    });
  }
}
