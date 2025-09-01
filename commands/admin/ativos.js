// commands/admin/ativos.js
module.exports = {
    name: 'ativos',
    description: 'Mostra os usuários mais ativos do grupo (admin)',
    usage: 'ativos',
    execute: async ({ message, config, chat, client }) => {
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            await message.react('📊');
            
            const loadingMsg = await message.reply('📊 Analisando atividade dos membros...');

            const StatsHandler = require('../../src/StatsHandler');
            const statsHandler = new StatsHandler(config);
            
            const usersStats = statsHandler.getUsersStats(chat.id._serialized);
            
            if (usersStats.length === 0) {
                await loadingMsg.edit('📊 Nenhuma estatística de atividade encontrada!\n\n💡 As estatísticas são coletadas desde que o bot entrou no grupo.');
                return;
            }

            let response = `📊 *USUÁRIOS MAIS ATIVOS* 📊\n\n📱 *Grupo:* ${chat.name}\n📈 *Total de usuários com stats:* ${usersStats.length}\n\n`;
            
            // Mostra top 15 usuários mais ativos
            const topUsers = usersStats.slice(0, 15);
            
            for (let i = 0; i < topUsers.length; i++) {
                const user = topUsers[i];
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📊';
                const daysSinceFirst = Math.floor((Date.now() - user.firstSeen) / (1000 * 60 * 60 * 24));
                const daysSinceLast = Math.floor((Date.now() - user.lastSeen) / (1000 * 60 * 60 * 24));
                
                response += `${medal} *${i + 1}.* ${user.userName}\n`;
                response += `📱 @${user.userNumber}\n`;
                response += `💬 ${user.messageCount} mensagens\n`;
                response += `🕒 Última atividade: ${daysSinceLast === 0 ? 'hoje' : `${daysSinceLast} dias atrás`}\n`;
                response += `📅 No grupo há: ${daysSinceFirst} dias\n\n`;
            }

            if (usersStats.length > 15) {
                response += `... e mais ${usersStats.length - 15} usuários\n\n`;
            }

            response += `🤖 *Bot:* ${config.NomeDoBot}\n`;
            response += `⏰ *Gerado em:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(response);
            
            console.log(`📊 Relatório de ativos gerado para ${chat.name} - ${usersStats.length} usuários`);

        } catch (error) {
            console.error('❌ Erro ao gerar relatório de ativos:', error);
            await message.reply('❌ Erro interno ao gerar relatório de usuários ativos.');
        }
    }
};
