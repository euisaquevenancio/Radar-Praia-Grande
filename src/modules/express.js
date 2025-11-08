import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

// IMPORTS DOS MODELS (funções createTable...)
import { createTableUsuario } from "../model/usuarioModel.js";
import { createTableAmizade } from "../model/amizadeModel.js";
import { createTableBairro } from "../model/bairroModel.js";
import { createTableNoticia } from "../model/noticiaModel.js";
import { createTableImagem } from "../model/imagemModel.js";
import { createTableCurtidaNoticia } from "../model/curtidaNoticiaModel.js";
import { createTableComentario } from "../model/comentarioModel.js";
import { createTableCurtidaComentario } from "../model/curtidaComentarioModel.js";
import { createTableCategoriaDenuncia } from "../model/categoriaDenunciaModel.js";
import { createTableDenunciaComentario } from "../model/denunciaComentarioModel.js";
import { createTableDenunciaNoticia } from "../model/denunciaNoticiaModel.js";
import { createTableDenunciaUsuario } from "../model/denunciaUsuarioModel.js";

import { impedeUsuariosAutenticados } from "../controller/usuarioController.js";

// Configurações para __dirname com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// === IMPORTANT: Trust proxy (Render, Heroku, etc.) ===
// Without this, Express doesn't detect HTTPS behind a proxy and cookies with `secure: true` won't be set.
app.set("trust proxy", 1);

// === Session setup (memorystore) ===
// We import memorystore dynamically to keep behavior compatible with ESM and avoid forcing dev-only imports.
const memorystore = (await import("memorystore")).default;
const MemoryStore = memorystore(session);

app.use(session({
  secret: process.env.SESSION_SECRET || "changeme",
  store: new MemoryStore({ checkPeriod: 86400000 }),
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour
    httpOnly: true,
    // In production (Render) we want secure + sameSite none so browsers accept cross-site cookies in HTTPS.
    // For your case frontend and backend are same-origin, but these settings are safe for production behind HTTPS.
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
}));

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Multer config para upload
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "../public")));

// Rotas estáticas e redirecionamentos
app.get("/index.html", (req, res) => res.redirect("/"));
app.get("/", impedeUsuariosAutenticados, (req, res) => {
  res.sendFile(path.join(__dirname, "../view/index.html"));
});

app.get("/cadastro.html", impedeUsuariosAutenticados, (req, res) => {
  res.sendFile(path.join(__dirname, "../view/cadastro.html"));
});
app.get("/login.html", impedeUsuariosAutenticados, (req, res) => {
  res.sendFile(path.join(__dirname, "../view/login.html"));
});

app.get("/admin/", (req, res) => res.redirect("/admin/login.html"));
app.get("/admin/login", (req, res) => res.redirect("/admin/login.html"));
app.get("/admin/login.html", impedeUsuariosAutenticados, (req, res) => {
  res.sendFile(path.join(__dirname, "../view/login-admin.html"));
});

// Rotas que precisam de autenticação (essas servem apenas HTML - a autenticação real deve ocorrer nas rotas /usuario/...)
app.get("/home.html", (req, res) => res.sendFile(path.join(__dirname, "../view/home.html")));
app.get("/cadastro-noticia.html", (req, res) => res.sendFile(path.join(__dirname, "../view/cadastro-noticia.html")));
app.get("/editar-noticia.html", (req, res) => res.sendFile(path.join(__dirname, "../view/editar-noticia.html")));
app.get("/resultados-pesquisa.html", (req, res) => res.sendFile(path.join(__dirname, "../view/resultados-pesquisa.html")));
app.get("/editar-perfil.html", (req, res) => res.sendFile(path.join(__dirname, "../view/editar-perfil.html")));
app.get("/perfil.html", (req, res) => res.sendFile(path.join(__dirname, "../view/perfil.html")));
app.get("/admin/consultar-usuarios.html", (req, res) => res.sendFile(path.join(__dirname, "../view/consultar-usuarios.html")));
app.get("/admin/consultar-noticias.html", (req, res) => res.sendFile(path.join(__dirname, "../view/consultar-noticias.html")));
app.get("/admin/consultar-comentarios.html", (req, res) => res.sendFile(path.join(__dirname, "../view/consultar-comentarios.html")));
app.get("/perfil/:apelidoOutroUsuario", (req, res) => res.sendFile(path.join(__dirname, "../view/perfil-outro-usuario.html")));
app.get("/noticias/:apelidoAutor/:idNoticia", (req, res) => res.sendFile(path.join(__dirname, "../view/noticia.html")));

// Importação e uso das rotas especializadas (essas rotas devem usar req.session no backend)
import usuarioRoutes from "../routes/usuarioRoutes.js";
import noticiaRoutes from "../routes/noticiaRoutes.js";
import imagemRoutes from "../routes/imagemRoutes.js";
import denunciaRoutes from "../routes/denunciaRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";

app.use("/usuario", usuarioRoutes);
app.use("/noticia", noticiaRoutes);
app.use("/imagem", imagemRoutes);
app.use("/denuncia", denunciaRoutes);
app.use("/admin", adminRoutes);

// Fallback 404 (aplica impedeUsuariosAutenticados antes de mostrar a página de erro)
app.use(impedeUsuariosAutenticados, (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../view/erro-404.html"));
});

// Criar as tabelas (executa após o app ter sido criado)
try {
  await createTableUsuario();
  await createTableAmizade();
  await createTableBairro();
  await createTableNoticia();
  await createTableImagem();
  await createTableCurtidaNoticia();
  await createTableComentario();
  await createTableCurtidaComentario();
  await createTableCategoriaDenuncia();
  await createTableDenunciaComentario();
  await createTableDenunciaNoticia();
  await createTableDenunciaUsuario();
  console.log("Tabelas verificadas/criadas com sucesso.");
} catch (err) {
  console.error("Erro ao criar/verificar tabelas:", err);
}

export default app;
