// commands/membros/play.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Busca e baixa música/vídeo do YouTube',
    usage: 'play <nome ou título>',
    execute: async ({ message, args, client, config }) => {
        // Verifica se foi fornecido um termo de busca
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}play <nome da música>\n\n💡 *Exemplo:* ${config.Prefixo}play Imagine Dragons Bones`);
        }

        const query = args.join(' ');
        
        try {
            // Reage com 🎵 na mensagem
            await message.react('🎵');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('🔍 Buscando no YouTube...');
            
            // Chama o script Python para buscar
            const searchResult = await runPythonScript('search', query);
            
            if (searchResult.error) {
                await loadingMsg.edit('❌ Erro na busca: ' + searchResult.error);
                return;
            }
            
            // Monta a mensagem de resultado
            const resultMessage = `> ✰͡ൣ᭄∆🔉𝐁𝐄𝐌✰𝐕𝐈𝐍𝐃𝐎🔊∆✰͡ൣ᭄
> ├☁️ Título: ${searchResult.title}
> ├☁️ Duração: ${searchResult.duration}
> ├☁️ Views: ${searchResult.views}
> ├☁️ Autor: ${searchResult.uploader}
0:00 ━❍──────── -${searchResult.duration} ↻ ⊲ Ⅱ ⊳ ↺ VOLUME: ▁▂▃▄▅▆▇ 100%
> 𝑵𝑬𝑳𝑳𝑰𝑬𝑳 𝑩𝑶𝑻 𝑽1 ♬
Baixado por ${config.NomeDoBot} 💞
Escolha entre "Áudio", "Vídeo", ou clique em "Cancelar" 👻`;

            // Prepara a thumbnail se disponível
            let media = null;
            if (searchResult.thumbnail && fs.existsSync(searchResult.thumbnail)) {
                media = MessageMedia.fromFilePath(searchResult.thumbnail);
            }
            
            // Cria os botões
            const buttons = [
                { body: '🔉 Áudio', id: `audio_${searchResult.id}` },
                { body: '📽 Vídeo', id: `video_${searchResult.id}` },
                { body: '❌ Cancelar', id: `cancel_${searchResult.id}` }
            ];

            // Edita a mensagem com o resultado e botões
            if (media) {
                await loadingMsg.edit(media, { caption: resultMessage });
            } else {
                await loadingMsg.edit(resultMessage);
            }
            
            // Salva informações do vídeo temporariamente para os botões
            global.tempVideoData = global.tempVideoData || {};
            global.tempVideoData[searchResult.id] = {
                url: searchResult.url,
                title: searchResult.title,
                uploader: searchResult.uploader,
                thumbnail: searchResult.thumbnail
            };
            
            // Limpa thumbnail temporária após um tempo
            if (searchResult.thumbnail) {
                setTimeout(() => {
                    if (fs.existsSync(searchResult.thumbnail)) {
                        fs.unlinkSync(searchResult.thumbnail);
                    }
                }, 300000); // 5 minutos
            }
            
            console.log(`🎵 Busca realizada: "${query}" - Resultado: ${searchResult.title}`);
            
        } catch (error) {
            console.error('❌ Erro no comando play:', error);
            await message.reply('❌ Erro interno ao buscar a música. Tente novamente mais tarde.');
        }
    }
};

// Função para executar script Python
function runPythonScript(action, ...args) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'youtube_downloader.py');
        const command = `python3 "${scriptPath}" ${action} "${args.join('" "')}"`;
        
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error('Erro Python:', error);
                resolve({ error: error.message });
                return;
            }
            
            if (stderr) {
                console.error('Python stderr:', stderr);
            }
            
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                console.error('Erro ao parsear JSON:', parseError);
                console.error('Output:', stdout);
                resolve({ error: 'Erro ao processar resposta do Python' });
            }
        });
    });
}

// Handler para botões (adicionar ao index.js)
/*
client.on('message_reaction', async (reaction) => {
    // Handler para reações em botões
    if (reaction.reaction === '🔉' || reaction.reaction === '📽' || reaction.reaction === '❌') {
        // Lógica para processar cliques nos botões
        console.log('Botão clicado:', reaction);
    }
});
*/
