<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1IwKBtmii1maX6hP2VGvncybX6H7lNsTB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the environment variables in `.env.local`:
   - `DATABASE_URL` - PostgreSQL connection string
   - `GEMINI_API_KEY` - Your Gemini API key
   - `NEXTAUTH_SECRET` - Secret for NextAuth (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000`)
3. Run database migrations:
   `npx prisma migrate dev`
4. Run the app:
   `npm run dev`

## Deploy no Vercel

### Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel do Vercel:

- `DATABASE_URL` - String de conexão do PostgreSQL (use o Vercel Postgres ou outro provedor)
- `GEMINI_API_KEY` - Sua chave da API do Gemini
- `NEXTAUTH_SECRET` - Secret para NextAuth (gere com `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL da sua aplicação no Vercel (ex: `https://seu-app.vercel.app`)

### Migrations

As migrations do Prisma são executadas automaticamente durante o build através do comando `prisma migrate deploy` no script de build. Certifique-se de que:

1. Todas as migrations estão commitadas no repositório
2. A variável `DATABASE_URL` está configurada corretamente no Vercel
3. O banco de dados PostgreSQL está acessível do Vercel
