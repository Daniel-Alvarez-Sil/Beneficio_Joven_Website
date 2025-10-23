import type { NextConfig } from "next";

// module.exports = {
//   experimental: {
//     serverActions: {
//       bodySizeLimit: '10mb',
//     },
//   },
// };

// const nextConfig: NextConfig = {
//   /* config options here */
// };

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // string or number (bytes) is fine
    },
  },
   typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
