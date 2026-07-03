import { defineEventHandler, readRawBody } from "h3";

const SENTRY_HOST = process.env.SENTRY_HOST!;
const SENTRY_PROJECT_IDS_RAW = process.env.SENTRY_PROJECT_IDS;
const KNOWN_PROJECT_IDS: string[] = (() => {
  if (!SENTRY_PROJECT_IDS_RAW) return ["4511668334821376"];
  try {
    const parsed = JSON.parse(SENTRY_PROJECT_IDS_RAW);
    return Array.isArray(parsed) ? parsed.map(String) : ["4511668334821376"];
  } catch {
    return ["4511668334821376"];
  }
})();
export default defineEventHandler(async (event) => {
  const body = await readRawBody(event);
  if (!body) {
    return new Response("No body", { status: 400 });
  }

  try {
    const lines = body.split("\n");
    const envelopeHeader = lines[0];
    if (!envelopeHeader) {
      return new Response("Invalid envelope", { status: 400 });
    }
    const header = JSON.parse(envelopeHeader);
    const dsn = new URL(header.dsn);
    const projectId = dsn.pathname.replace("/", "");

    if (!KNOWN_PROJECT_IDS.includes(projectId)) {
      return new Response("Invalid project ID", { status: 403 });
    }

    if (dsn.hostname !== SENTRY_HOST) {
      return new Response("Invalid Sentry host", { status: 403 });
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`;
    const response = await fetch(upstreamUrl, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-sentry-envelope" },
    });

    return new Response(null, { status: response.status });
  } catch (err) {
    console.error("[sentry-tunnel] Error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
