require("dotenv").config();
const express = require("express");
const path = require("path");
const SMB2 = require("@marsaud/smb2");
const mime = require("mime");

const app = express();
const port = process.env.PORT || 3000;

// Cliente SMB
const smb2Client = new SMB2({
  share: process.env.SMB_SHARE,
  domain: process.env.SMB_DOMAIN,
  username: process.env.SMB_USER,
  password: process.env.SMB_PASS,
});

// Servir frontend
app.use(express.static(path.join(__dirname, "public")));

// Middleware para CORS (caso precise)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Valida nomes para segurança
function isValidFileName(fileName) {
  return /^[\w\s\-\.\\]+$/.test(fileName);
}

// Função para extrair apenas o nome do arquivo (sem caminho)
function extractFileName(fullPath) {
  return fullPath.split('\\').pop() || fullPath;
}

// Função recursiva para listar vídeos em subpastas
async function listVideosRecursive(dir = "") {
  let videos = [];
  try {
    const files = await smb2Client.readdir(dir);

    for (const file of files) {
      const pathName = dir ? `${dir}\\${file}` : file;
      
      try {
        const stats = await smb2Client.stat(pathName);

        if (stats.isDirectory()) {
          const subVideos = await listVideosRecursive(pathName);
          videos = videos.concat(subVideos);
        } else if (/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i.test(file)) {
          videos.push(pathName);
        }
      } catch (fileError) {
        console.warn(`Erro ao acessar arquivo ${pathName}:`, fileError.message);
        continue;
      }
    }
  } catch (dirError) {
    console.error(`Erro ao acessar diretório ${dir}:`, dirError.message);
  }

  return videos;
}

// NOVA ROTA ESPECÍFICA PARA O BOT - Lista formatada
app.get("/bot/filmes", async (req, res) => {
  try {
    console.log("🤖 Bot solicitando lista de filmes...");
    
    const videos = await listVideosRecursive("");
    
    if (videos.length === 0) {
      return res.json({
        success: false,
        message: "Nenhum filme encontrado na VPS",
        total: 0,
        filmes: []
      });
    }

    // Extrair apenas nomes dos arquivos (sem caminho completo)
    const filmesNomes = videos.map(video => extractFileName(video));
    
    // Remover duplicatas e ordenar
    const filmesUnicos = [...new Set(filmesNomes)].sort();

    console.log(`✅ ${filmesUnicos.length} filmes encontrados para o bot`);

    res.json({
      success: true,
      message: "Filmes carregados com sucesso",
      total: filmesUnicos.length,
      filmes: filmesUnicos,
      servidor: "VPS Cinema",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Erro na rota /bot/filmes:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
      total: 0,
      filmes: []
    });
  }
});

// Rota original para listar vídeos (mantida para compatibilidade)
app.get("/files", async (req, res) => {
  try {
    const videos = await listVideosRecursive("");
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao listar arquivos");
  }
});

// NOVA ROTA - Status da API para o bot
app.get("/bot/status", (req, res) => {
  res.json({
    status: "online",
    servidor: "API Cinema VPS",
    timestamp: new Date().toISOString(),
    version: "2.0"
  });
});

// Rota de streaming de vídeo (mantida igual)
app.get("/video/:nome", async (req, res) => {
  const fileName = req.params.nome;

  if (!isValidFileName(fileName)) {
    return res.status(400).send("Nome de arquivo inválido");
  }

  try {
    const stats = await smb2Client.stat(fileName);
    const fileSize = stats.size;
    const range = req.headers.range;
    const contentType = mime.getType(fileName) || "application/octet-stream";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });

      smb2Client.createReadStream(fileName, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
      });

      smb2Client.createReadStream(fileName).pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao transmitir vídeo");
  }
});

// Rota raiz
app.get("/", (req, res) => {
  res.send(`
    <h1>🎬 API Cinema VPS</h1>
    <p>✅ Servidor online e funcionando!</p>
    <ul>
      <li><a href="/files">📁 Lista de arquivos (original)</a></li>
      <li><a href="/bot/filmes">🤖 Lista para bot</a></li>
      <li><a href="/bot/status">📊 Status da API</a></li>
    </ul>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`🌐 Acesso externo: http://66.228.61.24:${port}`);
  console.log(`🤖 Rota para bot: http://66.228.61.24:${port}/bot/filmes`);
});
