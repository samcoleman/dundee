import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "../../../server/api/root";

// export API handler
export default createNextApiHandler({
  router: appRouter,
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