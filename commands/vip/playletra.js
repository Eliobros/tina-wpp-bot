// commands/vip/playletra.js
const https = require('https');

module.exports = {
    name: 'playletra',
    description: 'Busca informações e trechos de letras de músicas (exclusivo VIP)',
    usage: 'playletra <artista> - <título>',
    execute: async ({ message, args, config }) => {
        // Verifica se foi fornecido artista e título
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}playletra <artista> - <título>\n\n💡 *Exemplos:*\n• ${config.Prefixo}playletra Imagine Dragons - Bones\n• ${config.Prefixo}playletra Ed Sheeran - Shape of You\n\n⭐ *Comando exclusivo VIP!*`);
        }

        const query = args.join(' ');
        
        // Verifica se tem o separador "-"
        if (!query.includes('-')) {
            return await message.reply(`❌ *Formato incorreto!*\n\n📖 *Use:* ${config.Prefixo}playletra artista - título\n\n💡 *Exemplo:* ${config.Prefixo}playletra Imagine Dragons - Bones`);
        }

        const [artist, title] = query.split('-').map(s => s?.trim());
        
        if (!artist || !title) {
            return await message.reply('❌ Artista e título são obrigatórios!\n\n💡 Use o formato: artista - título');
        }

        try {
            // Reage com 📝 na mensagem
            await message.react('📝');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('📝 Buscando informações da música...');
            
            // Busca informações da música
            const musicInfo = await buscarInfoMusica(artist, title);
            
            if (musicInfo.error) {
                await loadingMsg.edit(`❌ ${musicInfo.error}`);
                return;
            }

            // Formata a resposta (SEM reproduzir a letra completa)
            const resposta = formatarResposta(musicInfo, config);
            
            await loadingMsg.edit(resposta);
            
            console.log(`📝 Busca de letra realizada: ${artist} - ${title}`);
            
        } catch (error) {
            console.error('❌ Erro no comando playletra:', error);
            await message.reply('❌ Erro interno ao buscar informações da música. Tente novamente mais tarde.');
        }
    }
};

function buscarInfoMusica(artist, title) {
    return new Promise((resolve) => {
        // Normaliza caracteres especiais
        const artistNorm = encodeURIComponent(artist.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        const titleNorm = encodeURIComponent(title.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        
        // Usando API pública para informações básicas (não letras completas)
        const url = `https://api.lyrics.ovh/v1/${artistNorm}/${titleNorm}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    if (json.lyrics) {
                        // Pega apenas as primeiras linhas para preview (não a letra completa)
                        const lines = json.lyrics.split('\n').filter(line => line.trim());
                        const preview = lines.slice(0, 4).join('\n'); // Apenas 4 linhas como preview
                        
                        resolve({
                            artist: decodeURIComponent(artistNorm),
                            title: decodeURIComponent(titleNorm),
                            preview: preview,
                            hasLyrics: true
                        });
                    } else {
                        resolve({ 
                            error: `❌ Não encontrei informações para "${artist} - ${title}".\n\nVerifique se o artista e título estão corretos.` 
                        });
                    }
                } catch (parseError) {
                    resolve({ 
                        error: 'Erro ao processar informações da música.' 
                    });
                }
            });
            
        }).on('error', (error) => {
            console.error('Erro na requisição:', error);
            resolve({ 
                error: 'Erro de conexão com o serviço de música.' 
            });
        });
    });
}

function formatarResposta(info, config) {
    return `✰͡ൣ᭄∆📝 𝐈𝐍𝐅𝐎 𝐃𝐀 𝐌Ú𝐒𝐈𝐂𝐀 ∆✰͡ൣ᭄

🎶 *${info.artist} - ${info.title}*

📝 *Preview da letra:*
─────────────────────
${info.preview}
[...]
─────────────────────

💡 *Para letra completa:*
• Acesse plataformas oficiais
• Spotify, Apple Music, YouTube Music
• Sites oficiais do artista

🔗 *Links sugeridos:*
• 🎵 Spotify: spotify.com
• 🎬 YouTube: youtube.com
• 📱 Genius: genius.com

⭐ *Comando exclusivo VIP*
> ${config.NomeDoBot} ♬
Consultado por ${config.NomeDoBot} 💞`;
}
