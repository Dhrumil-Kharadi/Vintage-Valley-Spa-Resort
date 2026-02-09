"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.HttpError = void 0;
const env_1 = require("../config/env");
class HttpError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.HttpError = HttpError;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({
            ok: false,
            error: { message: err.message },
        });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const stack = err instanceof Error ? err.stack : undefined;
    if (env_1.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error(err);
    }
    return res.status(500).json({
        ok: false,
        error: {
            message: env_1.env.NODE_ENV === "production" ? "Internal Server Error" : message,
            ...(env_1.env.NODE_ENV === "production" ? {} : { stack }),
        },
    });
};
exports.errorHandler = errorHandler;
