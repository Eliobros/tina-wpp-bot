// commands/admin/limpeza.js
module.exports = {
    name: 'limpeza',
    description: 'Remove usuários inativos dos últimos 7 dias do grupo (admin)',
    usage: 'limpeza [dias] (padrão: 7 dias)',
    execute: async ({ message, args, config, chat, client }) => {
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            const daysInactive = args[0] ? parseInt(args[0]) : 7;
            
            if (isNaN(daysInactive) || daysInactive < 1 || daysInactive > 30) {
                return await message.reply(`❌ Número de dias inválido!\n\n💡 Use entre 1 e 30 dias\n📖 Exemplo: ${config.Prefixo}limpeza 7`);
            }

            await message.react('🧹');
            
            const loadingMsg = await message.reply(`🧹 Iniciando limpeza de usuários inativos (${daysInactive} dias)...`);

            const StatsHandler = require('../../src/StatsHandler');
            const statsHandler = new StatsHandler(config);
            
            const inactiveUsers = statsHandler.getInactiveUsers(chat.id._serialized, daysInactive);
            
            if (inactiveUsers.length === 0) {
                await loadingMsg.edit(`🧹 Nenhum usuário inativo encontrado!\n\nTodos os membros estiveram ativos nos últimos ${daysInactive} dias.`);
                return;
            }

            // Filtra apenas membros comuns (não remove admins)
            const participantsToRemove = [];
            const adminsSkipped = [];
            
            for (const inactiveUser of inactiveUsers) {
                try {
                    const participant = chat.participants.find(p => 
                        p.id._serialized.includes(inactiveUser.userNumber)
                    );
                    
                    if (participant) {
                        if (participant.isAdmin) {
                            adminsSkipped.push(inactiveUser);
                        } else {
                            participantsToRemove.push({
                                id: participant.id._serialized,
                                userNumber: inactiveUser.userNumber,
                                userName: inactiveUser.userName
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Erro ao verificar usuário ${inactiveUser.userNumber}:`, error);
                }
            }

            if (participantsToRemove.length === 0) {
                await loadingMsg.edit(`🧹 *LIMPEZA CONCLUÍDA* 🧹\n\n⚠️ Nenhum usuário foi removido!\n\n💡 *Motivos possíveis:*\n• Todos os inativos são administradores\n• Usuários já saíram do grupo\n• Apenas membros ativos no período`);
                return;
            }

            // Pergunta confirmação
            await loadingMsg.edit(`⚠️ *CONFIRMAÇÃO DE LIMPEZA* ⚠️\n\n🧹 *Usuários inativos encontrados:* ${inactiveUsers.length}\n👥 *Serão removidos:* ${participantsToRemove.length}\n🛡️ *Admins preservados:* ${adminsSkipped.length}\n📅 *Período de inatividade:* ${daysInactive} dias\n\n💡 *Responda com "CONFIRMAR" para prosseguir*\n⏰ *Tempo limite: 30 segundos*`);

            // Aguarda confirmação
            const filter = (msg) => {
                return msg.from === message.from && 
                       msg.body.toUpperCase() === 'CONFIRMAR';
            };

            const confirmationPromise = new Promise((resolve) => {
                const timeout = setTimeout(() => resolve(null), 30000);
                
                const messageHandler = (msg) => {
                    if (filter(msg)) {
                        clearTimeout(timeout);
                        client.removeListener('message', messageHandler);
                        resolve(msg);
                    }
                };
                
                client.on('message', messageHandler);
            });

            const confirmation = await confirmationPromise;

            if (!confirmation) {
                await loadingMsg.edit('❌ Limpeza cancelada por timeout (30 segundos)');
                return;
            }

            // Executa a limpeza
            await loadingMsg.edit('🧹 Executando limpeza... Por favor, aguarde.');
            
            let removedCount = 0;
            let errorCount = 0;
            const removedUsers = [];

            for (const user of participantsToRemove) {
                try {
                    await chat.removeParticipants([user.id]);
                    removedUsers.push(user);
                    removedCount++;
                    
                    // Pequena pausa entre remoções
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    console.error(`Erro ao remover ${user.userName}:`, error);
                    errorCount++;
                }
            }

            // Remove stats dos usuários removidos
            const removedNumbers = removedUsers.map(u => u.userNumber);
            statsHandler.removeUserStats(removedNumbers, chat.id._serialized);

            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';

            // Relatório final
            let finalReport = `✅ *LIMPEZA CONCLUÍDA* ✅\n\n📊 *Resultados:*\n`;
            finalReport += `✅ Removidos: ${removedCount} usuários\n`;
            finalReport += `❌ Erros: ${errorCount} usuários\n
