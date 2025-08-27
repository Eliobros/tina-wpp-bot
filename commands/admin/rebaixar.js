// commands/admin/rebaixar.js
module.exports = {
    name: 'rebaixar',
    description: 'Remove o cargo de administrador de um usuário',
    usage: 'rebaixar @usuario ou responder mensagem',
    execute: async ({ message, args, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        let userToDemote = null;

        // Verifica se é uma resposta a uma mensagem
        if (message.hasQuotedMsg) {
            const quotedMessage = await message.getQuotedMessage();
            userToDemote = quotedMessage.from;
        } 
        // Verifica se foi mencionado alguém
        else if (message.mentionedIds && message.mentionedIds.length > 0) {
            userToDemote = message.mentionedIds[0];
        }
        // Verifica se foi passado um número como argumento
        else if (args.length > 0) {
            const number = args[0].replace(/[^0-9]/g, '');
            if (number.length > 0) {
                userToDemote = number + '@c.us';
            }
        }

        // Se não encontrou usuário para rebaixar
        if (!userToDemote) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Formas de usar:*\n• ${config.Prefixo}rebaixar @usuario\n• ${config.Prefixo}rebaixar 5511999999999\n• Responder mensagem + ${config.Prefixo}rebaixar\n\n💡 *Exemplo:* ${config.Prefixo}rebaixar @5511999999999`);
        }

        try {
            // Verifica se o usuário está no grupo
            const participant = chat.participants.find(p => p.id._serialized === userToDemote);
            if (!participant) {
                return await message.reply('❌ Usuário não encontrado no grupo!');
            }

            // Verifica se é administrador
            if (!participant.isAdmin) {
                return await message.reply('❌ Este usuário não é administrador!');
            }

            // Verifica se está tentando rebaixar o próprio bot
            const botId = client.info.wid._serialized;
            if (userToDemote === botId) {
                return await message.reply('❌ Não posso rebaixar a mim mesmo! 😅');
            }

            // Verifica se está tentando rebaixar o dono do bot
            const userNumber = userToDemote.replace('@c.us', '');
            if (userNumber === config.NumeroDono) {
                return await message.reply(`❌ Não posso rebaixar meu dono ${config.NickDono}! 👑`);
            }

            // Pega informações do usuário a ser rebaixado
            const contact = await client.getContactById(userToDemote);
            const userName = contact.pushname || contact.name || userToDemote.split('@')[0];

            // Executa o rebaixamento
            await chat.demoteParticipants([userToDemote]);
            
            // Pega o nome de quem executou o comando
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            const successMessage = `✅ *Usuário rebaixado com sucesso!*\n\n📉 *Ex-Admin:* ${userName}\n🛡️ *Rebaixado por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n👤 Agora é membro comum do grupo.`;
            
            // Menciona o usuário rebaixado
            await message.reply(successMessage, null, { mentions: [userToDemote] });
            
            console.log(`📉 Rebaixamento executado: ${userName} foi rebaixado por ${authorName}`);

        } catch (error) {
            console.error('❌ Erro ao rebaixar usuário:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para rebaixar usuários!');
            } else if (error.message.includes('not found')) {
                await message.reply('❌ Usuário não encontrado!');
            } else {
                await message.reply('❌ Ocorreu um erro ao tentar rebaixar o usuário. Verifique se sou administrador do grupo.');
            }
        }
    }
};
