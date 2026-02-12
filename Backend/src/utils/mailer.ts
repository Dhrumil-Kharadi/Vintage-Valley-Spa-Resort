import nodemailer from "nodemailer";

type MailAttachment = {
  filename: string;
  content: string | Buffer;
  contentType?: string;
};

export const createGmailTransporter = (params: { user: string; appPassword: string }) => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: params.user,
      pass: params.appPassword,
    },
  });
};

export const createSmtpTransporter = (params: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}) => {
  return nodemailer.createTransport({
    host: params.host,
    port: params.port,
    secure: params.secure,
    auth: {
      user: params.user,
      pass: params.pass,
    },
  });
};

export const sendMailSafe = async (params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  gmailUser?: string;
  gmailAppPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  attachments?: MailAttachment[];
}) => {
  const smtpHost = params.smtpHost;
  const smtpPort = params.smtpPort;
  const smtpUser = params.smtpUser;
  const smtpPass = params.smtpPass;
  const smtpSecure = params.smtpSecure;

  const gmailUser = params.gmailUser;
  const gmailAppPassword = params.gmailAppPassword;

  const hasSmtp = !!(smtpHost && smtpPort && smtpUser && smtpPass);
  const hasGmail = !!(gmailUser && gmailAppPassword);

  if (!hasSmtp && !hasGmail) return;

  const transporter = hasSmtp
    ? createSmtpTransporter({
        host: String(smtpHost),
        port: Number(smtpPort),
        secure: Boolean(smtpSecure),
        user: String(smtpUser),
        pass: String(smtpPass),
      })
    : createGmailTransporter({ user: String(gmailUser), appPassword: String(gmailAppPassword) });

  await transporter.sendMail({
    from: params.from ?? (hasSmtp ? String(smtpUser) : String(gmailUser)),
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    html: params.html,
    attachments: params.attachments,
  });
};
