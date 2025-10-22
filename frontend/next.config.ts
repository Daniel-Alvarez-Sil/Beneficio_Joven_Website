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
};

export default nextConfig;
