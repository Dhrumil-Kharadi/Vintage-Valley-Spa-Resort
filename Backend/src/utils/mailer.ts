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
    requireTLS: params.port === 587,
    tls: {
      // Some environments/hosts (esp. gmail) can fail on local dev due to TLS inspection.
      // This does not disable encryption; it only relaxes certificate validation.
      rejectUnauthorized: false,
    },
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
  const stripWrappingQuotes = (s: string) => {
    const t = String(s ?? "").trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1).trim();
    }
    return t;
  };

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

  const host = stripWrappingQuotes(String(smtpHost));
  const port = Number(smtpPort);
  const user = stripWrappingQuotes(String(smtpUser));
  const pass = stripWrappingQuotes(String(smtpPass))
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
  console.log("MAILER CONFIG >>>", {
    host,
    port,
    secure,
    smtpSecureRaw: smtpSecure,
    userMasked: user ? `${user.slice(0, 2)}***${user.slice(-2)}` : "",
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
    const sendWith = async (cfg: { host: string; port: number; secure: boolean; label: string }) => {
      const transporter = createSmtpTransporter({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        user,
        pass,
      });

      try {
        await transporter.verify();
      } catch (verifyErr) {
        // eslint-disable-next-line no-console
        console.error("MAILER VERIFY ERROR >>>", { label: cfg.label, err: verifyErr });
      }

      return transporter.sendMail({
        from: params.from ?? user,
        to: params.to,
        replyTo: params.replyTo,
        subject: params.subject,
        html: params.html,
        attachments: params.attachments,
      });
    };

    let info: any;
    try {
      info = await sendWith({ host, port, secure, label: "primary" });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("MAILER SEND ERROR >>>", { label: "primary", err });

      // Fallback for Gmail: some networks block/interfere with STARTTLS on 587.
      const isGmailHost = String(host).toLowerCase() === "smtp.gmail.com";
      const shouldTrySsl465 = isGmailHost && port === 587;
      if (!shouldTrySsl465) throw err;

      // eslint-disable-next-line no-console
      console.error("MAILER RETRY >>> attempting Gmail SSL 465 fallback");
      info = await sendWith({ host, port: 465, secure: true, label: "fallback_465_ssl" });
    }

    // eslint-disable-next-line no-console
    console.log("MAILER SENT >>>", {
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
    // eslint-disable-next-line no-console
    console.error(
      "MAILER HINT >>> If you see 535 BadCredentials, regenerate a Gmail App Password for the same account as SMTP_USER and update SMTP_PASS in BOTH Backend/.env and Admin/.env."
    );
  }
};
