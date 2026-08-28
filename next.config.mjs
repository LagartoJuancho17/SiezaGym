/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/hasaneyldrm/exercises-dataset/**",
      },
    ],
  },
};

export default nextConfig;
