// commands/admin/ban.js
module.exports = {
    name: 'ban',
    description: 'Remove um usuário do grupo (admin)',
    usage: 'ban @usuario ou responder mensagem',
    execute: async ({ message, args, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        let userToBan = null;

        // Verifica se é uma resposta a uma mensagem
        if (message.hasQuotedMsg) {
            const quotedMessage = await message.getQuotedMessage();
            userToBan = quotedMessage.from;
        } 
        // Verifica se foi mencionado alguém
        else if (message.mentionedIds && message.mentionedIds.length > 0) {
            userToBan = message.mentionedIds[0];
        }
        // Verifica se foi passado um número como argumento
        else if (args.length > 0) {
            const number = args[0].replace(/[^0-9]/g, '');
            if (number.length > 0) {
                userToBan = number + '@c.us';
            }
        }

        // Se não encontrou usuário para banir
        if (!userToBan) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Formas de usar:*\n• ${config.Prefixo}ban @usuario\n• ${config.Prefixo}ban 5511999999999\n• Responder mensagem + ${config.Prefixo}ban\n\n💡 *Exemplo:* ${config.Prefixo}ban @5511999999999`);
        }

        try {
            // Verifica se o usuário está no grupo
            const participant = chat.participants.find(p => p.id._serialized === userToBan);
            if (!participant) {
                return await message.reply('❌ Usuário não encontrado no grupo!');
            }

            // Verifica se não está tentando banir um admin
            if (participant.isAdmin) {
                return await message.reply('❌ Não posso banir um administrador do grupo!');
            }

            // Verifica se não está tentando banir o próprio bot
            const botId = client.info.wid._serialized;
            if (userToBan === botId) {
                return await message.reply('❌ Não posso banir a mim mesmo! 😅');
            }

            // Pega informações do usuário a ser banido
            const contact = await client.getContactById(userToBan);
            const userName = contact.pushname || contact.name || userToBan.split('@')[0];

            // Executa o ban
            await chat.removeParticipants([userToBan]);
            
            // Pega o nome de quem executou o comando
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            await message.reply(`✅ *Usuário banido com sucesso!*\n\n👤 *Banido:* ${userName}\n🛡️ *Por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`);
            
            console.log(`🔨 Ban executado: ${userName} foi banido por ${authorName}`);

        } catch (error) {
            console.error('❌ Erro ao banir usuário:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para remover este usuário!');
            } else if (error.message.includes('not found')) {
                await message.reply('❌ Usuário não encontrado!');
            } else {
                await message.reply('❌ Ocorreu um erro ao tentar banir o usuário. Verifique se sou administrador do grupo.');
            }
        }
    }
};
