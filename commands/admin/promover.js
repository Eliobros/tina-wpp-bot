// commands/admin/promover.js
module.exports = {
    name: 'promover',
    description: 'Promove um usuário a administrador do grupo',
    usage: 'promover @usuario ou responder mensagem',
    execute: async ({ message, args, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        let userToPromote = null;

        // Verifica se é uma resposta a uma mensagem
        if (message.hasQuotedMsg) {
            const quotedMessage = await message.getQuotedMessage();
            userToPromote = quotedMessage.from;
        } 
        // Verifica se foi mencionado alguém
        else if (message.mentionedIds && message.mentionedIds.length > 0) {
            userToPromote = message.mentionedIds[0];
        }
        // Verifica se foi passado um número como argumento
        else if (args.length > 0) {
            const number = args[0].replace(/[^0-9]/g, '');
            if (number.length > 0) {
                userToPromote = number + '@c.us';
            }
        }

        // Se não encontrou usuário para promover
        if (!userToPromote) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Formas de usar:*\n• ${config.Prefixo}promover @usuario\n• ${config.Prefixo}promover 5511999999999\n• Responder mensagem + ${config.Prefixo}promover\n\n💡 *Exemplo:* ${config.Prefixo}promover @5511999999999`);
        }

        try {
            // Verifica se o usuário está no grupo
            const participant = chat.participants.find(p => p.id._serialized === userToPromote);
            if (!participant) {
                return await message.reply('❌ Usuário não encontrado no grupo!');
            }

            // Verifica se já é administrador
            if (participant.isAdmin) {
                return await message.reply('❌ Este usuário já é administrador!');
            }

            // Verifica se está tentando promover o próprio bot
            const botId = client.info.wid._serialized;
            if (userToPromote === botId) {
                return await message.reply('❌ Não posso promover a mim mesmo! 😅');
            }

            // Pega informações do usuário a ser promovido
            const contact = await client.getContactById(userToPromote);
            const userName = contact.pushname || contact.name || userToPromote.split('@')[0];

            // Executa a promoção
            await chat.promoteParticipants([userToPromote]);
            
            // Pega o nome de quem executou o comando
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            const successMessage = `✅ *Usuário promovido com sucesso!*\n\n🎉 *Novo Admin:* ${userName}\n🛡️ *Promovido por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n👑 Parabéns pela promoção!`;
            
            // Menciona o usuário promovido
            await message.reply(successMessage, null, { mentions: [userToPromote] });
            
            console.log(`👑 Promoção executada: ${userName} foi promovido por ${authorName}`);

        } catch (error) {
            console.error('❌ Erro ao promover usuário:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para promover usuários!');
            } else if (error.message.includes('not found')) {
                await message.reply('❌ Usuário não encontrado!');
            } else {
                await message.reply('❌ Ocorreu um erro ao tentar promover o usuário. Verifique se sou administrador do grupo.');
            }
        }
    }
};
