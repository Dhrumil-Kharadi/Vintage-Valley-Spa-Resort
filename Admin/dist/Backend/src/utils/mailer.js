"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMailSafe = exports.createSmtpTransporter = exports.createGmailTransporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const createGmailTransporter = (params) => {
    return nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: params.user,
            pass: params.appPassword,
        },
    });
};
exports.createGmailTransporter = createGmailTransporter;
const createSmtpTransporter = (params) => {
    return nodemailer_1.default.createTransport({
        host: params.host,
        port: params.port,
        secure: params.secure,
        auth: {
            user: params.user,
            pass: params.pass,
        },
    });
};
exports.createSmtpTransporter = createSmtpTransporter;
const sendMailSafe = async (params) => {
    const smtpHost = params.smtpHost;
    const smtpPort = params.smtpPort;
    const smtpUser = params.smtpUser;
    const smtpPass = params.smtpPass;
    const smtpSecure = params.smtpSecure;
    const hasSmtp = !!(smtpHost && smtpPort && smtpUser && smtpPass);
    if (!hasSmtp) {
        // eslint-disable-next-line no-console
        console.error("MAILER SKIP >>> missing SMTP config", {
            hasHost: !!smtpHost,
            hasPort: !!smtpPort,
            hasUser: !!smtpUser,
            hasPass: !!smtpPass,
        });
        return;
    }
    const host = String(smtpHost).trim();
    const port = Number(smtpPort);
    const user = String(smtpUser).trim();
    const pass = String(smtpPass)
        .trim()
        .replace(/\s+/g, "");
    let secure = (() => {
        if (typeof smtpSecure === "boolean")
            return smtpSecure;
        if (typeof smtpSecure === "string") {
            const s = smtpSecure.trim().toLowerCase();
            if (s === "true" || s === "1" || s === "yes" || s === "y")
                return true;
            if (s === "false" || s === "0" || s === "no" || s === "n" || s === "")
                return false;
        }
        return Boolean(smtpSecure);
    })();
    if (port === 587 && secure === true)
        secure = false;
    if (port === 465 && secure === false)
        secure = true;
    // eslint-disable-next-line no-console
    console.error("MAILER CONFIG >>>", {
        host,
        port,
        secure,
        smtpSecureRaw: smtpSecure,
        to: params.to,
    });
    if (!host || !Number.isFinite(port) || !user || !pass) {
        // eslint-disable-next-line no-console
        console.error("MAILER SKIP >>> invalid SMTP config", {
            host,
            port,
            hasUser: !!user,
            hasPass: !!pass,
            secure,
        });
        return;
    }
    try {
        const transporter = (0, exports.createSmtpTransporter)({
            host,
            port,
            secure,
            user,
            pass,
        });
        const info = await transporter.sendMail({
            from: params.from ?? user,
            to: params.to,
            replyTo: params.replyTo,
            subject: params.subject,
            html: params.html,
            attachments: params.attachments,
        });
        // eslint-disable-next-line no-console
        console.error("MAILER SENT >>>", {
            to: params.to,
            subject: params.subject,
            messageId: info?.messageId,
            response: info?.response,
            accepted: info?.accepted,
            rejected: info?.rejected,
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("MAILER ERROR >>>", err);
    }
};
exports.sendMailSafe = sendMailSafe;
