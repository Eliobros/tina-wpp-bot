// commands/admin/fantasmas.js
module.exports = {
    name: 'fantasmas',
    description: 'Lista usuários que nunca enviaram mensagens no grupo (admin)',
    usage: 'fantasmas',
    execute: async ({ message, config, chat, client }) => {
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            await message.react('👻');
            
            const loadingMsg = await message.reply('👻 Identificando usuários fantasmas...');

            const StatsHandler = require('../../src/StatsHandler');
            const statsHandler = new StatsHandler(config);
            
            // Pega todos os participantes do grupo
            const allParticipants = chat.participants;
            const usersStats = statsHandler.getUsersStats(chat.id._serialized);
            
            // Identifica fantasmas (usuários sem stats ou com 0 mensagens)
            const fantasmas = [];
            
            for (const participant of allParticipants) {
                const userNumber = participant.id._serialized.replace('@c.us', '');
                const userStats = usersStats.find(u => u.userNumber === userNumber);
                
                // Se não tem stats ou tem 0 mensagens, é fantasma
                if (!userStats || userStats.messageCount === 0) {
                    try {
                        const contact = await client.getContactById(participant.id._serialized);
                        const userName = contact.pushname || contact.name || userNumber;
                        
                        fantasmas.push({
                            userNumber,
                            userName,
                            isAdmin: participant.isAdmin
                        });
                    } catch (error) {
                        // Se não conseguir pegar o contato, adiciona só com número
                        fantasmas.push({
                            userNumber,
                            userName: userNumber,
                            isAdmin: participant.isAdmin
                        });
                    }
                }
            }

            if (fantasmas.length === 0) {
                await loadingMsg.edit('👻 Não há usuários fantasmas neste grupo!\n\nTodos os membros já enviaram pelo menos uma mensagem.');
                return;
            }

            let response = `👻 *USUÁRIOS FANTASMAS* 👻\n\n📱 *Grupo:* ${chat.name}\n👥 *Total de membros:* ${allParticipants.length}\n👻 *Fantasmas encontrados:* ${fantasmas.length}\n\n`;
            
            // Separa admins fantasmas de membros fantasmas
            const adminsFantasmas = fantasmas.filter(f => f.isAdmin);
            const membrosFantasmas = fantasmas.filter(f => !f.isAdmin);
            
            if (adminsFantasmas.length > 0) {
                response += `🛡️ *ADMINS FANTASMAS:* ${adminsFantasmas.length}\n`;
                for (let i = 0; i < adminsFantasmas.length && i < 10; i++) {
                    const fantasma = adminsFantasmas[i];
                    response += `👻 ${fantasma.userName} (@${fantasma.userNumber})\n`;
                }
                if (adminsFantasmas.length > 10) {
                    response += `... e mais ${adminsFantasmas.length - 10} admins\n`;
                }
                response += '\n';
            }
            
            if (membrosFantasmas.length > 0) {
                response += `👥 *MEMBROS FANTASMAS:* ${membrosFantasmas.length}\n`;
                const maxShow = Math.min(membrosFantasmas.length, 20);
                for (let i = 0; i < maxShow; i++) {
                    const fantasma = membrosFantasmas[i];
                    response += `👻 ${fantasma.userName} (@${fantasma.userNumber})\n`;
                }
                if (membrosFantasmas.length > 20) {
                    response += `... e mais ${membrosFantasmas.length - 20} membros\n`;
                }
            }

            response += `\n💡 *Info:* Usuários que nunca enviaram mensagens desde que o bot entrou no grupo\n\n🧹 *Para limpar:* Use ${config.Prefixo}limpeza\n\n🤖 *Bot:* ${config.NomeDoBot}\n⏰ *Gerado em:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(response);
            
            console.log(`👻 Relatório de fantasmas gerado para ${chat.name} - ${fantasmas.length} fantasmas encontrados`);

        } catch (error) {
            console.error('❌ Erro ao gerar relatório de fantasmas:', error);
            await message.reply('❌ Erro interno ao gerar relatório de usuários fantasmas.');
        }
    }
};
