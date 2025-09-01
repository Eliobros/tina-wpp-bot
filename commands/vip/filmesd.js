// commands/vip/filmesd.js
const axios = require('axios'); // Certifique-se de ter axios instalado: npm install axios

module.exports = {
    name: 'filmesd',
    description: 'Lista todos os filmes disponíveis na VPS (exclusivo VIP)',
    usage: 'filmesd',
    execute: async ({ message, config, client }) => {
        try {
            // Reage com 🎬
            await message.react('🎬');

            // Mensagem de loading
            const loadingMsg = await message.reply('🎬 Acessando biblioteca de filmes na VPS...');

            // URL da sua API
            const apiUrl = 'http://66.228.61.24:3000/bot/filmes';
            
            // Timeout de 30 segundos
            const timeout = 30000;

            // Faz requisição para a API
            const response = await axios.get(apiUrl, { 
                timeout: timeout,
                headers: {
                    'User-Agent': 'WhatsApp-Bot-Cinema/1.0'
                }
            });

            const resultado = response.data;

            if (!resultado.success) {
                await loadingMsg.edit(`❌ Erro ao acessar filmes: ${resultado.message || 'Erro desconhecido'}`);
                return;
            }

            const { filmes, total } = resultado;

            if (total === 0) {
                await loadingMsg.edit('📂 Nenhum filme encontrado na VPS!');
                return;
            }

            // Formatar mensagem com filmes numerados
            let mensagemFilmes = `🎬 *FILMES DISPONÍVEIS NA VPS* 🎬\n\n`;
            mensagemFilmes += `📊 *Total:* ${total} filmes\n`;
            mensagemFilmes += `🖥️ *Servidor:* VPS Cinema\n`;
            mensagemFilmes += `⏰ *Atualizado:* ${new Date().toLocaleString('pt-BR')}\n\n`;
            mensagemFilmes += `📋 *LISTA COMPLETA:*\n\n`;

            // Determinar quantos filmes mostrar (WhatsApp tem limite de caracteres)
            const maxFilmesPorMensagem = 100;
            const filmesParaMostrar = Math.min(filmes.length, maxFilmesPorMensagem);

            // Adicionar filmes numerados
            for (let i = 0; i < filmesParaMostrar; i++) {
                const numeroFormatado = (i + 1).toString().padStart(3, '0');
                mensagemFilmes += `🎭 ${numeroFormatado}. ${filmes[i]}\n`;
            }

            // Se tem mais filmes que o limite
            if (filmes.length > maxFilmesPorMensagem) {
                mensagemFilmes += `\n⚠️ *Mostrando ${maxFilmesPorMensagem} de ${total} filmes*\n`;
                mensagemFilmes += `📝 Para ver todos, use comandos específicos\n`;
            }

            // Footer da mensagem
            mensagemFilmes += `\n⭐ *Comando exclusivo VIP*\n`;
            mensagemFilmes += `🤖 *Bot:* ${config.NomeDoBot || 'Cinema Bot'}\n`;
            mensagemFilmes += `🌐 *API Status:* Online ✅`;

            // Verificar tamanho da mensagem (WhatsApp tem limite)
            if (mensagemFilmes.length > 4000) {
                // Dividir em múltiplas mensagens se necessário
                await enviarMensagemDividida(loadingMsg, mensagemFilmes, message);
            } else {
                await loadingMsg.edit(mensagemFilmes);
            }

            console.log(`✅ Lista de filmes enviada - ${total} filmes encontrados`);

        } catch (error) {
            console.error('❌ Erro no comando filmesd:', error);
            
            let mensagemErro = '❌ Erro ao acessar filmes da VPS.\n\n';
            
            if (error.code === 'ECONNREFUSED') {
                mensagemErro += '🔌 *Causa:* Servidor VPS offline ou inacessível\n';
                mensagemErro += '💡 *Solução:* Verifique se a API está rodando';
            } else if (error.code === 'ENOTFOUND') {
                mensagemErro += '🌐 *Causa:* Problema de DNS ou IP incorreto\n';
                mensagemErro += '💡 *Solução:* Verifique o endereço da VPS';
            } else if (error.code === 'ETIMEDOUT') {
                mensagemErro += '⏰ *Causa:* Timeout na conexão (>30s)\n';
                mensagemErro += '💡 *Solução:* VPS pode estar sobrecarregada';
            } else {
                mensagemErro += `📝 *Detalhes:* ${error.message}\n`;
                mensagemErro += '💡 *Solução:* Contate o administrador';
            }

            await message.reply(mensagemErro);
        }
    }
};

// Função auxiliar para dividir mensagens grandes
async function enviarMensagemDividida(loadingMsg, mensagemCompleta, message) {
    try {
        // Dividir a mensagem em partes menores
        const limite = 3500; // Margem de segurança
        const linhas = mensagemCompleta.split('\n');
        let mensagemAtual = '';
        let parteNumero = 1;
        
        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i] + '\n';
            
            if ((mensagemAtual + linha).length > limite) {
                // Enviar parte atual
                const header = `📄 *PARTE ${parteNumero}* 📄\n\n`;
                
                if (parteNumero === 1) {
                    await loadingMsg.edit(header + mensagemAtual);
                } else {
                    await message.reply(header + mensagemAtual);
                }
                
                // Resetar para próxima parte
                mensagemAtual = linha;
                parteNumero++;
            } else {
                mensagemAtual += linha;
            }
        }
        
        // Enviar última parte
        if (mensagemAtual.trim()) {
            const header = parteNumero > 1 ? `📄 *PARTE ${parteNumero}* 📄\n\n` : '';
            
            if (parteNumero === 1) {
                await loadingMsg.edit(header + mensagemAtual);
            } else {
                await message.reply(header + mensagemAtual + '\n✅ *Lista completa enviada!*');
            }
        }
        
    } catch (error) {
        console.error('Erro ao dividir mensagem:', error);
        await message.reply('❌ Lista muito grande. Tente novamente mais tarde.');
    }
}
