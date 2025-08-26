// commands/vip/filmesd.js
module.exports = {
    name: 'filmesd',
    description: 'Lista todos os filmes disponíveis na VPS (exclusivo VIP)',
    usage: 'filmesd',
    execute: async ({ message, config, client }) => {
        try {
            // Reage com 🎬
            await message.react('🎬');
            
            // Verifica se a VPS está conectada
            if (!client.vpsHandler || !client.vpsHandler.getVPSStatus().connected) {
                return await message.reply('❌ VPS não está conectada! Entre em contato com o dono.');
            }

            // Mensagem de loading
            const loadingMsg = await message.reply('🎬 Acessando biblioteca de filmes na VPS...');

            // Busca os filmes
            const resultado = await client.vpsHandler.getFilmes();

            if (!resultado.success) {
                await loadingMsg.edit(`❌ Erro ao acessar filmes: ${resultado.error}`);
                return;
            }

            const { filmes, total } = resultado;

            if (total === 0) {
                await loadingMsg.edit('📂 Nenhum filme encontrado na VPS!');
                return;
            }

            // Formata a lista de filmes (limita para evitar mensagem muito grande)
            let filmesLista = `🎬 *FILMES DISPONÍVEIS* 🎬\n\n📊 *Total:* ${total} filmes\n🖥️ *Fonte:* VPS Cinema\n\n`;

            const maxFilmes = Math.min(filmes.length, 50); // Máximo 50 filmes por mensagem
            
            for (let i = 0; i < maxFilmes; i++) {
                const filme = filmes[i];
                filmesLista += `🎭 ${i + 1}. ${filme}\n`;
            }

            if (filmes.length > 50) {
                filmesLista += `\n... e mais ${filmes.length - 50} filmes!`;
            }

            filmesLista += `\n\n⭐ *Comando exclusivo VIP*\n🤖 *Bot:* ${config.NomeDoBot}\n⏰ *Atualizado:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(filmesLista);
            
            console.log(`🎬 Lista de filmes acessada - ${total} filmes encontrados`);

        } catch (error) {
            console.error('❌ Erro no comando filmesd:', error);
            await message.reply('❌ Erro interno ao acessar filmes da VPS. Tente novamente mais tarde.');
        }
    }
};
