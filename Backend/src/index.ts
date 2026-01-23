import { createServer } from "./server";
import { env } from "./config/env";

const app = createServer();

app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});
