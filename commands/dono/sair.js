// commands/dono/sair.js
module.exports = {
    name: 'sair',
    description: 'Faz o bot sair do grupo (apenas dono)',
    usage: 'sair',
    execute: async ({ message, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            // Reage com 👋
            await message.react('👋');
            
            // Pega informações do grupo
            const groupName = chat.name;
            const memberCount = chat.participants.length;
            
            // Mensagem de despedida
            const farewellMessage = `👋 *DESPEDIDA DO BOT* 👋

🤖 *${config.NomeDoBot}* está saindo do grupo!

📱 *Grupo:* ${groupName}
👥 *Membros:* ${memberCount}
👑 *Comando executado por:* ${config.NickDono}
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}

✨ *Obrigado por usar nossos serviços!*
📞 *Contato do dono:* ${config.NumeroDono}

🫡 *Até a próxima!*`;

            // Envia mensagem de despedida
            await message.reply(farewellMessage);
            
            // Log antes de sair
            console.log(`👋 Bot saindo do grupo: ${groupName} (${memberCount} membros) - Comando do dono`);
            
            // Aguarda um pouco para a mensagem ser enviada
            setTimeout(async () => {
                try {
                    // Sai do grupo
                    await chat.leave();
                    console.log(`✅ Bot saiu com sucesso do grupo: ${groupName}`);
                } catch (leaveError) {
                    console.error('❌ Erro ao sair do grupo:', leaveError);
                }
            }, 3000); // 3 segundos de delay

        } catch (error) {
            console.error('❌ Erro no comando sair:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para sair do grupo!');
            } else {
                await message.reply('❌ Erro interno ao tentar sair do grupo. Tente novamente mais tarde.');
            }
        }
    }
};
