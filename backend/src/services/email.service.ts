import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function isSmtpConfigured(): boolean {
  return !!(env.SMTP_HOST && env.EMAIL_FROM);
}

function createTransport() {
  return nodemailer.createTransport({
    host:      env.SMTP_HOST,
    port:      env.SMTP_PORT,
    secure:    env.SMTP_PORT === 465,
    ignoreTLS: env.SMTP_PORT === 25,     // Papercut on port 25 doesn't do STARTTLS
    tls:       { rejectUnauthorized: false },
    ...(env.SMTP_USER && env.SMTP_PASS
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.log(`[email] SMTP non configuré — token de vérification pour ${to}: ${token}`);
    return;
  }
  const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  await createTransport().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Vérifiez votre adresse email — QuizzTest",
    html: `<p>Bienvenue sur QuizzTest !</p>
<p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email (valable 24h) :</p>
<p><a href="${link}">${link}</a></p>
<p>Si vous n'avez pas créé de compte, ignorez cet email.</p>`,
  });
}

export async function sendParentalConsentEmail(
  parentEmail: string,
  childUsername: string,
  token: string,
): Promise<void> {
  if (!isSmtpConfigured()) {
    console.log(`[email] SMTP non configuré — token consentement parental pour ${parentEmail}: ${token}`);
    return;
  }
  const approveLink = `${env.FRONTEND_URL}/parental-consent?token=${token}&action=approve`;
  const denyLink    = `${env.FRONTEND_URL}/parental-consent?token=${token}&action=deny`;
  await createTransport().sendMail({
    from: env.EMAIL_FROM,
    to: parentEmail,
    subject: `Consentement parental requis pour le compte de ${childUsername} — QuizzTest`,
    html: `<p>Votre enfant <strong>${childUsername}</strong> souhaite créer un compte sur QuizzTest, une application de chat et de quiz.</p>
<p>En tant que responsable légal, votre accord est nécessaire.</p>
<p>
  <a href="${approveLink}" style="background:#22c55e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
    Autoriser le compte
  </a>
  &nbsp;
  <a href="${denyLink}" style="background:#ef4444;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
    Refuser le compte
  </a>
</p>
<p>Ce lien expire dans 7 jours. Sans réponse, le compte sera automatiquement supprimé.</p>`,
  });
}

export async function sendAdminAlert(subject: string, html: string): Promise<void> {
  if (!isSmtpConfigured() || !env.ADMIN_EMAIL) return;
  await createTransport().sendMail({
    from: env.EMAIL_FROM,
    to: env.ADMIN_EMAIL,
    subject: `[QuizzTest] ${subject}`,
    html,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.log(`[email] SMTP non configuré — token reset pour ${to}: ${token}`);
    return;
  }
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await createTransport().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Réinitialisation de mot de passe — QuizzTest",
    html: `<p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.</p>
<p><a href="${link}">Réinitialiser mon mot de passe</a> (valable 1h)</p>
<p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>`,
  });
}
