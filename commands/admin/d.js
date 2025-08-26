// commands/admin/d.js
module.exports = {
    name: 'd',
    description: 'Deleta/apaga uma mensagem marcada (admin)',
    usage: 'd (responder uma mensagem)',
    execute: async ({ message, client, config, chat }) => {
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            if (!message.hasQuotedMsg) {
                return await message.reply(`❌ *Uso incorreto!*\n📖 *Como usar:* Responda uma mensagem + ${config.Prefixo}d`);
            }

            const quotedMessage = await message.getQuotedMessage();

            if (!quotedMessage) {
                return await message.reply('❌ Mensagem não encontrada ou já foi deletada!');
            }

            // Verifica se o bot é admin
            const me = await chat.getContactById(client.info.wid._serialized);
            const botParticipant = chat.participants.find(p => p.id._serialized === client.info.wid._serialized);

            if (!botParticipant?.isAdmin) {
                return await message.reply('❌ Eu preciso ser administrador para deletar mensagens de outros!');
            }

            // Deleta a mensagem
            await quotedMessage.delete(true); // true = delete for everyone

            // Confirmação
            await message.react('✅');
            const author = await quotedMessage.getContact();
            const confirmation = `🗑️ *MENSAGEM DELETADA* 🗑️\n👤 Autor: ${author.pushname || author.name || 'Usuário'}\n🛡️ Deletada por: ${me.pushname || me.name}\n⏰ ${new Date().toLocaleString('pt-BR')}`;
            const confirmMsg = await message.reply(confirmation);

            // Remove mensagem do comando + confirmação depois de 10s
            setTimeout(async () => {
                try {
                    await confirmMsg.delete();
                    await message.delete();
                } catch {}
            }, 10000);

            console.log(`🗑️ Mensagem deletada por ${me.pushname || me.name} no grupo ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao deletar mensagem:', error);
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para deletar mensagens!');
            } else {
                await message.reply('❌ Erro interno ao deletar mensagem. Tente novamente mais tarde.');
            }
        }
    }
};
