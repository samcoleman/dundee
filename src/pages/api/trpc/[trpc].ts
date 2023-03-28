import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "../../../server/api/root";

// export API handler
export default createNextApiHandler({
  router: appRouter,
});