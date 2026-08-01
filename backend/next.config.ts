import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // whatsapp-web.js depends on Node-specific runtime behavior and is not browser code.
  serverExternalPackages: ["whatsapp-web.js"],
};

export default nextConfig;
