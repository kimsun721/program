import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "1025"),
  secure: false,
  tls: { rejectUnauthorized: false },
});

export async function sendVerificationEmail(
  to: string,
  token: string,
  type: "SIGNUP" | "RESET_PW"
) {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

  if (type === "SIGNUP") {
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@linguaclass.kr",
      to,
      subject: "[LinguaClass] 이메일 인증을 완료해주세요",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">LinguaClass 이메일 인증</h1>
          <p>안녕하세요! LinguaClass에 가입해 주셔서 감사합니다.</p>
          <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
          <a href="${verifyUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            이메일 인증하기
          </a>
          <p style="color: #6b7280; font-size: 14px;">이 링크는 24시간 후 만료됩니다.</p>
          <p style="color: #6b7280; font-size: 14px;">본인이 가입하지 않으셨다면 이 이메일을 무시하셔도 됩니다.</p>
        </div>
      `,
    });
  } else {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@linguaclass.kr",
      to,
      subject: "[LinguaClass] 비밀번호 재설정 안내",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">비밀번호 재설정</h1>
          <p>비밀번호 재설정을 요청하셨습니다.</p>
          <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            비밀번호 재설정하기
          </a>
          <p style="color: #6b7280; font-size: 14px;">이 링크는 1시간 후 만료됩니다.</p>
          <p style="color: #6b7280; font-size: 14px;">본인이 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.</p>
        </div>
      `,
    });
  }
}
