import "./config/preloadEnv";

import { createServer } from "./server";

const app = createServer();

const port = Number(process.env.ADMIN_PORT ?? 5051);

app.listen(port, () => {
  console.log(`Admin backend listening on port ${port}`);
});
