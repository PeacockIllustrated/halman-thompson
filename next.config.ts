import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // AI-generated homepage product imagery (Higgsfield CDN). Remove once
        // the images are self-hosted under /public/images/products.
        protocol: "https",
        hostname: "d8j0ntlcm91z4.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
  // Transpile Three.js packages for proper tree-shaking
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
  ],
};

export default nextConfig;
