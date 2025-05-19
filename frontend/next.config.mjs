/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ["cdn.getro.com"],
    },
    typescript: {
      ignoreBuildErrors: true, // Skip TypeScript type checking
    },
    eslint: {
      ignoreDuringBuilds: true, // Skip ESLint checks during builds
    },
  };
  
  export default nextConfig;
