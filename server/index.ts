import { POST as complianceCheck } from "./api/compliance-check.ts";
import { POST as policyIngest } from "./api/policy-ingest.ts";

const requiredEnvVars = ["ANTHROPIC_API_KEY", "DAYTONA_API_KEY"] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const server = Bun.serve({
  hostname: "0.0.0.0", // Listen on all network interfaces
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/health": {
      GET: () => {
        return Response.json({ status: "ok", timestamp: new Date().toISOString() });
      },
    },
    "/api/policies/ingest": {
      POST: policyIngest,
    },
    "/api/compliance/check": {
      POST: complianceCheck,
    },
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
  error(error) {
    console.error("Unhandled server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`🚀 Bun server listening on http://localhost:${server.port}`);
console.log(`📡 Accessible from network at http://<your-ip>:${server.port}`);
console.log(`   Find your IP with: ifconfig | grep "inet " | grep -v 127.0.0.1`);