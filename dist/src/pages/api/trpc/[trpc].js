"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const next_1 = require("@trpc/server/adapters/next");
const root_1 = require("../../../server/api/root");
// export API handler
exports.default = (0, next_1.createNextApiHandler)({
    router: root_1.appRouter,
    onError({ error }) {
        if (error.code === 'INTERNAL_SERVER_ERROR') {
            // send to bug reporting
            console.error('Something went wrong', error);
        }
    },
    /**
     * Enable query batching
     */
    batching: {
        enabled: true,
    },
});
