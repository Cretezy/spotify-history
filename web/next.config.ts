import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config({ path: "../.env", quiet: true });

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
