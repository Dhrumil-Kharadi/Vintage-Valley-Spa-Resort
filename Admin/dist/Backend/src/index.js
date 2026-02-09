"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const env_1 = require("./config/env");
const app = (0, server_1.createServer)();
app.listen(env_1.env.PORT, () => {
    console.log(`Backend listening on port ${env_1.env.PORT}`);
});
