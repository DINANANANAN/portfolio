import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the tracing root to this project so Next doesn't pick up the
  // unrelated lockfile in the parent (home) directory.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
