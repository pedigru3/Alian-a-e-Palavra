import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;

  try {
    await resend.emails.send({
      from: 'Aliança & Palavra <onboarding@aliancaepalavra.com.br>',
      to: email,
      subject: 'Confirme seu endereço de e-mail',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #db2777; text-align: center;">Bem-vindo ao Aliança & Palavra!</h2>
          <p>Olá,</p>
          <p>Obrigado por se cadastrar. Para começar sua jornada devocional em casal, por favor confirme seu e-mail clicando no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmLink}" style="background-color: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmar E-mail</a>
          </div>
          <p>Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:</p>
          <p style="word-break: break-all; color: #6b7280;">${confirmLink}</p>
          <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 30px 0;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">Este é um e-mail automático, por favor não responda.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Falha ao enviar e-mail de verificação');
  }
};
