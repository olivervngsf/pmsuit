/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static HTML export: the dummy data is baked in at build time, so the
  // deployed site is pure static files — no server, no database, no functions
  // at runtime. This is the lowest-cost way to host the demo ($0 on any free
  // static tier). To run as a full dynamic app again, remove `output` and the
  // `generateStaticParams` exports, and restore the API routes.
  output: "export",
};

export default nextConfig;
