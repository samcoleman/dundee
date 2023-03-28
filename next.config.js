/**
 * @link https://nextjs.org/docs/api-reference/next.config.js/introduction
 */

/** @type {import("next").NextConfig} */
module.exports = {
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    APP_URL: process.env.APP_URL,
    TREE_COOKIE: process.env.TREE_COOKIE,
  },
  /** We run eslint as a separate task in CI */
  eslint: { ignoreDuringBuilds: !!process.env.CI },
};
