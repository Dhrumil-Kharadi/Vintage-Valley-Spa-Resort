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
    const gmailUser = params.gmailUser;
    const gmailAppPassword = params.gmailAppPassword;
    const hasSmtp = !!(smtpHost && smtpPort && smtpUser && smtpPass);
    const hasGmail = !!(gmailUser && gmailAppPassword);
    if (!hasSmtp && !hasGmail)
        return;
    const transporter = hasSmtp
        ? (0, exports.createSmtpTransporter)({
            host: String(smtpHost),
            port: Number(smtpPort),
            secure: Boolean(smtpSecure),
            user: String(smtpUser),
            pass: String(smtpPass),
        })
        : (0, exports.createGmailTransporter)({ user: String(gmailUser), appPassword: String(gmailAppPassword) });
    await transporter.sendMail({
        from: params.from ?? (hasSmtp ? String(smtpUser) : String(gmailUser)),
        to: params.to,
        replyTo: params.replyTo,
        subject: params.subject,
        html: params.html,
        attachments: params.attachments,
    });
};
exports.sendMailSafe = sendMailSafe;
