"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/preloadEnv");
const server_1 = require("./server");
const app = (0, server_1.createServer)();
const port = Number(process.env.ADMIN_PORT ?? 5051);
app.listen(port, () => {
    console.log(`Admin backend listening on port ${port}`);
});
