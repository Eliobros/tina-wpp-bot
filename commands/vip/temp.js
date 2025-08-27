// commands/vip/temp.js
module.exports = {
    name: 'temp',
    description: 'Mostra as temporadas de uma série específica (exclusivo VIP)',
    usage: 'temp <número da série>',
    execute: async ({ message, args, config, client, vpsHandler, userNumber }) => {
        // Verifica se foi fornecido um número
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}temp <número da série>\n\n💡 *Exemplo:* ${config.Prefixo}temp 1\n\n📺 *Primeiro use:* ${config.Prefixo}seriesd para ver a lista numerada`);
        }

        const serieIndex = parseInt(args[0]) - 1;

        if (isNaN(serieIndex) || serieIndex < 0) {
            return await message.reply('❌ Número da série inválido! Use apenas números positivos.');
        }

        try {
            // Reage com 📂
            await message.react('📂');
            
            // Verifica se a VPS está conectada
            if (!vpsHandler || !vpsHandler.getVPSStatus().connected) {
                return await message.reply('❌ VPS não está conectada! Entre em contato com o dono.');
            }

            // Verifica se o usuário tem lista de séries salva
            const userSeriesList = vpsHandler.seriesLists.get(userNumber);
            if (!userSeriesList) {
                return await message.reply(`❌ Você precisa usar ${config.Prefixo}seriesd primeiro para carregar a lista de séries!`);
            }

            // Verifica se o índice é válido
            if (serieIndex >= userSeriesList.series.length) {
                return await message.reply(`❌ Série não encontrada! Use um número entre 1 e ${userSeriesList.series.length}.\n\n💡 Use ${config.Prefixo}seriesd para ver a lista atualizada.`);
            }

            const serieName = userSeriesList.series[serieIndex];

            // Mensagem de loading
            const loadingMsg = await message.reply(`📂 Buscando temporadas de "${serieName}"...`);

            // Busca as temporadas
            const resultado = await vpsHandler.getTemporadas(serieName, userNumber);

            if (!resultado.success) {
                await loadingMsg.edit(`❌ Erro ao acessar temporadas: ${resultado.error}`);
                return;
            }

            const { temporadas, total } = resultado;

            if (total === 0) {
                await loadingMsg.edit(`📂 Nenhuma temporada encontrada para "${serieName}"!`);
                return;
            }

            // Formata a lista de temporadas
            let temporadasLista = `📂 *TEMPORADAS DE "${serieName.toUpperCase()}"* 📂\n\n📊 *Total:* ${total} temporadas\n🖥️ *Fonte:* VPS Cinema\n\n`;
            
            for (let i = 0; i < temporadas.length; i++) {
                const temporada = temporadas[i];
                temporadasLista += `📁 ${i + 1}. ${temporada}\n`;
            }

            temporadasLista += `\n\n💡 *Para ver episódios:*\n${config.Prefixo}episodios ${serieIndex + 1} <número da temporada>\n\n📖 *Exemplo:* ${config.Prefixo}episodios ${serieIndex + 1} 1\n\n⭐ *Comando exclusivo VIP*\n🤖 *Bot:* ${config.NomeDoBot}\n⏰ *Consultado:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(temporadasLista);
            
            console.log(`📂 Temporadas de "${serieName}" acessadas por usuário ${userNumber} - ${total} temporadas encontradas`);

        } catch (error) {
            console.error('❌ Erro no comando temp:', error);
            await message.reply('❌ Erro interno ao acessar temporadas. Tente novamente mais tarde.');
        }
    }
};
