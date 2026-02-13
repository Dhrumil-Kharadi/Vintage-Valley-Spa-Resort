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
  smtpSecure?: boolean | string;
  smtpUser?: string;
  smtpPass?: string;
  attachments?: MailAttachment[];
}) => {
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
    if (typeof smtpSecure === "boolean") return smtpSecure;
    if (typeof smtpSecure === "string") {
      const s = smtpSecure.trim().toLowerCase();
      if (s === "true" || s === "1" || s === "yes" || s === "y") return true;
      if (s === "false" || s === "0" || s === "no" || s === "n" || s === "") return false;
    }
    return Boolean(smtpSecure);
  })();

  if (port === 587 && secure === true) secure = false;
  if (port === 465 && secure === false) secure = true;

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
    const transporter = createSmtpTransporter({
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
      messageId: (info as any)?.messageId,
      response: (info as any)?.response,
      accepted: (info as any)?.accepted,
      rejected: (info as any)?.rejected,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("MAILER ERROR >>>", err);
  }
};
