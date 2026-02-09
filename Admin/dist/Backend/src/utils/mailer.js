"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMailSafe = exports.createGmailTransporter = void 0;
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
const sendMailSafe = async (params) => {
    const gmailUser = params.gmailUser;
    const gmailAppPassword = params.gmailAppPassword;
    if (!gmailUser || !gmailAppPassword)
        return;
    const transporter = (0, exports.createGmailTransporter)({ user: gmailUser, appPassword: gmailAppPassword });
    await transporter.sendMail({
        from: params.from ?? gmailUser,
        to: params.to,
        subject: params.subject,
        html: params.html,
    });
};
exports.sendMailSafe = sendMailSafe;
