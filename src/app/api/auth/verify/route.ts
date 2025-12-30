import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Token de verificação ausente.', { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return new NextResponse('Token de verificação inválido ou expirado.', { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
      },
    });

    // Return a simple HTML for the browser
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>E-mail Confirmado | Aliança & Palavra</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            background-color: #fff1f2; /* love50 */
          }
          .card { 
            background: white; 
            padding: 48px 32px; 
            border-radius: 32px; 
            box-shadow: 0 20px 40px rgba(244, 63, 94, 0.1); /* love500 shadow */
            text-align: center; 
            max-width: 420px; 
            border: 2px solid #fecdd3; /* love200 */
          }
          h1 { 
            font-family: 'Playfair Display', serif;
            color: #881337; /* love900 */
            margin-bottom: 20px;
            font-size: 32px;
          }
          p { 
            color: #475569; /* textSecondary */
            line-height: 1.6;
            font-size: 16px;
          }
          .btn {
            display: inline-block;
            margin-top: 32px;
            padding: 16px 32px;
            background-color: #e11d48; /* love600 */
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
            transition: transform 0.2s;
          }
          .btn:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>E-mail Confirmado!</h1>
          <p>Obrigado por validar seu acesso. Sua jornada espiritual em casal está a apenas um passo de começar.</p>
          <p>Agora você já pode abrir o aplicativo <strong>Aliança & Palavra</strong> para fazer seu login.</p>
          <a href="/app" class="btn">Ir para o Aplicativo</a>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    return new NextResponse('Erro interno ao verificar e-mail.', { status: 500 });
  }
}
