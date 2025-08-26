// commands/vip/seriesd.js
module.exports = {
    name: 'seriesd',
    description: 'Lista todas as séries disponíveis na VPS (exclusivo VIP)',
    usage: 'seriesd',
    execute: async ({ message, config, client, userNumber }) => {
        try {
            // Reage com 📺
            await message.react('📺');
            
            // Verifica se a VPS está conectada
            if (!client.vpsHandler || !client.vpsHandler.getVPSStatus().connected) {
                return await message.reply('❌ VPS não está conectada! Entre em contato com o dono.');
            }

            // Mensagem de loading
            const loadingMsg = await message.reply('📺 Acessando biblioteca de séries na VPS...');

            // Busca as séries
            const resultado = await client.vpsHandler.getSeries();

            if (!resultado.success) {
                await loadingMsg.edit(`❌ Erro ao acessar séries: ${resultado.error}`);
                return;
            }

            const { series, total, path } = resultado;

            if (total === 0) {
                await loadingMsg.edit('📂 Nenhuma série encontrada na VPS!');
                return;
            }

            // Salva a lista de séries para este usuário (para usar no comando /temp)
            client.vpsHandler.saveSeriesList(userNumber, { series, path });

            // Formata a lista de séries (limita para evitar mensagem muito grande)
            let seriesLista = `📺 *SÉRIES DISPONÍVEIS* 📺\n\n📊 *Total:* ${total} séries\n🖥️ *Fonte:* VPS Cinema\n\n`;

            const maxSeries = Math.min(series.length, 30); // Máximo 30 séries por mensagem
            
            for (let i = 0; i < maxSeries; i++) {
                const serie = series[i];
                seriesLista += `📽️ ${i + 1}. ${serie}\n`;
            }

            if (series.length > 30) {
                seriesLista += `\n... e mais ${series.length - 30} séries!`;
            }

            seriesLista += `\n\n💡 *Para ver temporadas:*\n${config.Prefixo}temp <número da série>\n\n📖 *Exemplo:* ${config.Prefixo}temp 1\n\n⭐ *Comando exclusivo VIP*\n🤖 *Bot:* ${config.NomeDoBot}\n⏰ *Atualizado:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(seriesLista);
            
            console.log(`📺 Lista de séries acessada por usuário ${userNumber} - ${total} séries encontradas`);

        } catch (error) {
            console.error('❌ Erro no comando seriesd:', error);
            await message.reply('❌ Erro interno ao acessar séries da VPS. Tente novamente mais tarde.');
        }
    }
};
