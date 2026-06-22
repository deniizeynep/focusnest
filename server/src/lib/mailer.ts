import "dotenv/config";
import nodemailer from "nodemailer";

function createTransporter() {
  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.replace(/\s/g, "");

  console.log("SMTP CHECK:", {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    passExists: Boolean(smtpPass),
  });

  if (!smtpUser || !smtpPass) {
    throw new Error(
      "SMTP_USER veya SMTP_PASS eksik. server/.env dosyasını kontrol et.",
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const smtpUser = process.env.SMTP_USER?.trim();
  const from = process.env.MAIL_FROM || `FocusNest <${smtpUser}>`;

  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: "FocusNest - Şifre Sıfırlama Kodu",
    text: `FocusNest şifre sıfırlama kodunuz: ${token}

Bu kod 15 dakika geçerlidir.

Eğer bu isteği siz yapmadıysanız bu e-postayı dikkate almayın.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #f6f6f8;">
        <div style="max-width: 520px; margin: auto; background: white; border-radius: 16px; padding: 28px;">
          <h2 style="margin-top: 0;">🔑 FocusNest Şifre Sıfırlama</h2>

          <p>Şifre sıfırlama kodunuz:</p>

          <div style="
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            background: #f1f1f5;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
          ">
            ${token}
          </div>

          <p>Bu kod <b>15 dakika</b> geçerlidir.</p>

          <p style="color: #777; font-size: 13px;">
            Eğer bu isteği siz yapmadıysanız bu e-postayı dikkate almayın.
          </p>
        </div>
      </div>
    `,
  });
}
