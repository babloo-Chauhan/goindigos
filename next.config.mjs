const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL && !process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  console.warn("NEXT_PUBLIC_SITE_URL is not set, so canonical links and the sitemap will point at localhost. Set it before deploying.");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // A self-contained server folder for uploading to the live server. `npm run start` needs the normal build.
  ...(process.env.BUILD_STANDALONE === "true" && { output: "standalone" }),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  experimental: {
    agentFeedback: true,
    // Leaves room for the 2 MB logo upload and the rest of the settings form.
    serverActions: { bodySizeLimit: "2.5mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
