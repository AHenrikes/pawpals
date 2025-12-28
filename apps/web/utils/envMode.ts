type Environment = "development" | "production" | "test";

const ENV_LABELS: Record<Environment, string> = {
  development: "devMode",
  production: "liveMode",
  test: "testMode",
} as const;

export default function envMode(msg: string, err?: Error): void {
  const env = process.env.NODE_ENV as Environment | undefined;

  if (!env || !(env in ENV_LABELS)) {
    console.error("Invalid or missing enviroments");
    return;
  }

  const label = ENV_LABELS[env];

  // In production, avoid logging sensitive error details
  if (env === "production") {
    console.error(`${label}: ${msg}`);
    
    // Only log error message, not stack trace in production
    if (err) console.error("Error:", err.message);
  } else {
    // Development/test: log full details
    console.log(`${label}: ${msg}`, err);
  }
}
