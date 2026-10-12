const basePath = process.env.PASCAL_BASE_PATH ?? '/1008_codex_project/003-pascal-editor';

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  images: { unoptimized: true },
  transpilePackages: ['@pascal-app/core', '@pascal-app/viewer', '@pascal-app/editor', '@pascal-app/nodes'],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_ASSETS_CDN_URL: basePath || '.',
  },
};

export default config;
