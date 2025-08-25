// commands/admin/d.js
module.exports = {
    name: 'd',
    description: 'Deleta/apaga uma mensagem marcada (admin)',
    usage: 'd (responder uma mensagem)',
    execute: async ({ message, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            // Verifica se é uma resposta a uma mensagem
            if (!message.hasQuotedMsg) {
                return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* Responda uma mensagem + ${config.Prefixo}d\n\n💡 *Exemplo:* Responder a mensagem que quer deletar e usar ${config.Prefixo}d`);
            }

            const quotedMessage = await message.getQuotedMessage();
            
            // Verifica se a mensagem ainda existe
            if (!quotedMessage) {
                return await message.reply('❌ Mensagem não encontrada ou já foi deletada!');
            }

            // Pega informações da mensagem a ser deletada
            const messageAuthor = await quotedMessage.getContact();
            const authorName = messageAuthor.pushname || messageAuthor.name || 'Usuário';
            
            // Pega informações de quem executou o comando
            const admin = await message.getContact();
            const adminName = admin.pushname || admin.name || 'Admin';

            // Tenta deletar a mensagem
            const deleted = await quotedMessage.delete(true); // true = delete for everyone
            
            if (deleted) {
                // Reage com ✅ na mensagem do comando
                await message.react('✅');
                
                // Envia confirmação
                const confirmation = `🗑️ *MENSAGEM DELETADA* 🗑️\n\n👤 *Autor da mensagem:* ${authorName}\n🛡️ *Deletada por:* ${adminName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n✅ Mensagem removida para todos!`;
                
                const confirmMsg = await message.reply(confirmation);
                
                // Remove a confirmação após 10 segundos
                setTimeout(async () => {
                    try {
                        await confirmMsg.delete();
                        await message.delete(); // Remove também o comando
                    } catch (e) {
                        console.log('Não foi possível remover mensagens de confirmação');
                    }
                }, 10000);
                
                console.log(`🗑️ Mensagem deletada por ${adminName} no grupo ${chat.name} - Autor: ${authorName}`);
                
            } else {
                await message.reply('❌ Não foi possível deletar a mensagem. Ela pode ser muito antiga ou já foi removida.');
            }

        } catch (error) {
            console.error('❌ Erro ao deletar mensagem:', error);
            
            if (error.message.includes('Message too old')) {
                await message.reply('❌ A mensagem é muito antiga para ser deletada!');
            } else if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para deletar mensagens! Verifique se sou administrador.');
            } else {
                await message.reply('❌ Erro interno ao deletar mensagem. Tente novamente mais tarde.');
            }
        }
    }
};
