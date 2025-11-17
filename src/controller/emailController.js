import Brevo from "@getbrevo/brevo";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// Função exportada para gerar token
export async function gerarToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Função genérica que envia e-mail pelo Brevo
export async function enviarEmailBrevo({ to, subject, html }) {
  try {
    const email = {
      sender: {
        email: "radarpraiagrande2025@gmail.com",
        name: "Radar Praia Grande"
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    };

    const result = await apiInstance.sendTransacEmail(email);
    return result;
  } catch (error) {
    console.error("Erro ao enviar e-mail pelo Brevo:", error);
    throw error;
  }
}

// Conteúdo do e-mail de confirmação de cadastro
export async function gerarConteudoEmailConfirmarCadastro(email, token, apelido) {
  return {
    to: email,
    subject: "Confirme seu cadastro",
    html: `
      <h2>Confirmação de cadastro</h2>
      <p>Olá ${apelido}, para ativar sua conta clique no link abaixo:</p>
      <a href="http://localhost:8080/tokens/token-confirmar-cadastro/${apelido}/${token}">
        Confirmar cadastro
      </a>
      <p>Se você não fez este cadastro, ignore este e-mail.</p>
    `
  };
}


// Conteúdo do e-mail de redefinição de senha
export async function gerarConteudoEmailRedefinirSenha(email, token) {
  return {
    to: email,
    subject: "Redefinição de senha",
    html: `
      <h2>Redefinição de senha</h2>
      <p>Para redefinir sua senha clique no link abaixo:</p>
      <a href="http://localhost:8080/tokens/token-redefinir-senha/${token}">
        Redefinir senha
      </a>
      <p>Se você não pediu a redefinição, ignore este e-mail.</p>
    `
  };
}
