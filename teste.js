const { Client } = require("ssh2");
const fs = require("fs");
const readline = require("readline");

// Lê os dados do JSON
const config = JSON.parse(fs.readFileSync("dono/dono.json", "utf8"));
const { host, port, username, password, filmesPath, seriesPath } = config.VPS;

const conn = new Client();

conn.on("ready", () => {
  console.log("✅ Conectado via SSH!");

  function checkDir(path) {
    return new Promise((resolve, reject) => {
      const cmd = `if (Test-Path "${path}") { echo "EXISTE" } else { echo "NAO_EXISTE" }`;

      conn.exec(`powershell -Command "${cmd}"`, (err, stream) => {
        if (err) return reject(err);

        let data = "";
        stream.on("data", (chunk) => (data += chunk.toString()));
        stream.on("close", () => resolve(data.trim()));
      });
    });
  }

  (async () => {
    try {
      const filmes = await checkDir(filmesPath);
      const series = await checkDir(seriesPath);

      console.log("📁 Filmes:", filmes === "EXISTE" ? "Diretório encontrado ✅" : "Não existe ❌");
      console.log("📁 Séries:", series === "EXISTE" ? "Diretório encontrado ✅" : "Não existe ❌");

      console.log("\nDigite 'sair' para encerrar a conexão.");
      esperarComandoSaida();
    } catch (error) {
      console.error("Erro:", error);
    }
  })();
});

conn.on("close", () => {
  console.log("🔌 Conexão SSH fechada.");
});

conn.on("error", (err) => {
  console.error("❌ Erro na conexão SSH:", err);
});

conn.connect({
  host,
  port,
  username,
  password,
});

// Função para aguardar você digitar "sair"
function esperarComandoSaida() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    if (input.trim().toLowerCase() === "sair") {
      conn.end();
      rl.close();
    } else {
      console.log("Comando desconhecido. Digite 'sair' para encerrar.");
    }
  });
}
