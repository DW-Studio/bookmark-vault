import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 是原生 Node.js 模块，不能被 webpack 打包
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
