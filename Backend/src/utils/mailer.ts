import nodemailer from "nodemailer";

export const createGmailTransporter = (params: { user: string; appPassword: string }) => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: params.user,
      pass: params.appPassword,
    },
  });
};

export const sendMailSafe = async (params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  gmailUser?: string;
  gmailAppPassword?: string;
}) => {
  const gmailUser = params.gmailUser;
  const gmailAppPassword = params.gmailAppPassword;
  if (!gmailUser || !gmailAppPassword) return;

  const transporter = createGmailTransporter({ user: gmailUser, appPassword: gmailAppPassword });

  await transporter.sendMail({
    from: params.from ?? gmailUser,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
};
