import nodemailer from "nodemailer";

let transporter;

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD,
  );
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!isEmailConfigured()) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD.",
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_PORT) === "465",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function verifyEmailConnection() {
  if (!isEmailConfigured()) {
    return false;
  }

  try {
    await getTransporter().verify();
    return true;
  } catch (error) {
    transporter = undefined;

    if (error?.responseCode === 535 || error?.code === "EAUTH") {
      throw new Error(
        "Gmail rejected SMTP credentials. Use the exact sender email and a Google App Password, not the normal account password.",
      );
    }

    throw new Error(`SMTP connection failed: ${error.message}`);
  }
}

export async function sendPasswordResetEmail({ recipient, resetUrl }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER must be configured.");
  }

  await getTransporter().sendMail({
    from,
    to: recipient,
    subject: "Reset your GeoNexus password",
    text: [
      "A password reset was requested for your GeoNexus command account.",
      "",
      `Open this link within 15 minutes to choose a new password: ${resetUrl}`,
      "",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <p>A password reset was requested for your GeoNexus command account.</p>
      <p><a href="${resetUrl}">Reset your password</a> (this link expires in 15 minutes).</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
}
