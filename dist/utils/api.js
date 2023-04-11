"use strict";
/**
 * This is the client-side entrypoint for your tRPC API.
 * It's used to create the `api` object which contains the Next.js App-wrapper
 * as well as your typesafe react-query hooks.
 *
 * We also create a few inference helpers for input and output types
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const client_1 = require("@trpc/client");
const next_1 = require("@trpc/next");
const superjson_1 = __importDefault(require("superjson"));
const getBaseUrl = () => {
    var _a;
    if (typeof window !== "undefined")
        return ""; // browser should use relative url
    if (process.env.VERCEL_URL)
        return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
    return `http://localhost:${(_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000}`; // dev SSR should use localhost
};
/**
 * A set of typesafe react-query hooks for your tRPC API
 */
function getEndingLink() {
    if (typeof window === 'undefined') {
        return (0, client_1.httpBatchLink)({
            url: `${getBaseUrl()}/api/trpc`,
        });
    }
    const client = (0, client_1.createWSClient)({
        url: 'ws://localhost:3005',
    });
    return (0, client_1.wsLink)({
        client,
    });
}
exports.api = (0, next_1.createTRPCNext)({
    config() {
        return {
            /**
             * Transformer used for data de-serialization from the server
             * @see https://trpc.io/docs/data-transformers
             **/
            transformer: superjson_1.default,
            /**
             * Links used to determine request flow from client to server
             * @see https://trpc.io/docs/links
             * */
            links: [
                // adds pretty logs to your console in development and logs errors in production
                (0, client_1.loggerLink)({
                    enabled: (opts) => (process.env.NODE_ENV === 'development' &&
                        typeof window !== 'undefined') ||
                        (opts.direction === 'down' && opts.result instanceof Error),
                }),
                getEndingLink(),
            ],
            queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
        };
    },
    /**
     * Whether tRPC should await queries when server rendering pages
     * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
     */
    ssr: true,
});
