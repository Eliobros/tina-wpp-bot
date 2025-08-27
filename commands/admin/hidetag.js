// commands/admin/hidetag.js
module.exports = {
    name: 'hidetag',
    description: 'Menciona todos os membros do grupo de forma oculta (admin)',
    usage: 'hidetag <mensagem> ou responder mensagem',
    execute: async ({ message, args, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        let messageText = '';

        try {
            // Verifica se é uma resposta a uma mensagem
            if (message.hasQuotedMsg) {
                const quotedMessage = await message.getQuotedMessage();
                messageText = quotedMessage.body || 'Mensagem encaminhada';
            } 
            // Verifica se foi fornecida uma mensagem como argumento
            else if (args.length > 0) {
                messageText = args.join(' ');
            } else {
                return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Formas de usar:*\n• ${config.Prefixo}hidetag <sua mensagem>\n• Responder uma mensagem + ${config.Prefixo}hidetag\n\n💡 *Exemplo:* ${config.Prefixo}hidetag Atenção pessoal! Reunião hoje às 20h`);
            }

            // Pega todos os participantes do grupo
            const participants = chat.participants.map(participant => participant.id._serialized);
            
            // Remove o próprio bot da lista (opcional)
            const botId = client.info.wid._serialized;
            const mentions = participants.filter(id => id !== botId);

            if (mentions.length === 0) {
                return await message.reply('❌ Nenhum membro encontrado para mencionar!');
            }

            // Envia a mensagem mencionando todos de forma oculta
            await client.sendMessage(chat.id._serialized, messageText, {
                mentions: mentions
            });

            // Reage na mensagem original para confirmar
            await message.react('✅');

            // Log da ação
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            console.log(`📢 Hidetag executado por ${authorName} no grupo ${chat.name} - ${mentions.length} membros mencionados`);

        } catch (error) {
            console.error('❌ Erro no comando hidetag:', error);
            await message.reply('❌ Erro interno ao executar hidetag. Tente novamente mais tarde.');
        }
    }
};
