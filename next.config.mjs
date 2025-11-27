/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // 🚀 Performance optimizations for near-instantaneous loading
  experimental: {
    // Enable Partial Prerendering for instant page loads
    ppr: false, // Enable when stable

    // Optimize package imports (tree-shake large packages)
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "recharts",
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Enable response compression
  compress: true,

  // Power header for faster routing
  poweredByHeader: false,

  // Generate ETags for caching
  generateEtags: true,

  // Enable strict mode for better performance debugging
  reactStrictMode: true,
};

export default nextConfig;
