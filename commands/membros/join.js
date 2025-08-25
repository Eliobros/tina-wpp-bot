// commands/membros/join.js
module.exports = {
    name: 'join',
    description: 'Solicita entrada do bot em um grupo',
    usage: 'join <link do grupo>',
    execute: async ({ message, args, client, config, userNumber, contact }) => {
        // Verifica se foi fornecido um link
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}join <link do grupo>\n\n💡 *Exemplo:* ${config.Prefixo}join https://chat.whatsapp.com/XXXXXXXXXX\n\n⚠️ *Nota:* Se você for o dono, o bot entrará automaticamente. Caso contrário, será enviada uma solicitação de autorização.`);
        }

        const groupLink = args.join(' ').trim();

        // Valida se é um link válido do WhatsApp
        const whatsappLinkRegex = /https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/;
        const match = groupLink.match(whatsappLinkRegex);

        if (!match) {
            return await message.reply('❌ Link inválido!\n\n💡 Use um link no formato:\nhttps://chat.whatsapp.com/XXXXXXXXXX');
        }

        const inviteCode = match[1];
        const userName = contact.pushname || contact.name || 'Usuário';

        try {
            // Reage com 🤝
            await message.react('🤝');

            // Se for o dono, entra automaticamente
            if (userNumber === config.NumeroDono) {
                const loadingMsg = await message.reply('👑 Dono detectado! Entrando automaticamente no grupo...');
                
                try {
                    // Tenta entrar no grupo
                    const chatId = await client.acceptInvite(inviteCode);
                    const newChat = await client.getChatById(chatId);
                    
                    await loadingMsg.edit(`✅ *ENTRADA AUTOMÁTICA REALIZADA!* ✅\n\n📱 *Grupo:* ${newChat.name}\n👑 *Autorizado por:* ${config.NickDono} (Dono)\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n🎉 Bot adicionado com sucesso!`);
                    
                    console.log(`✅ Bot entrou automaticamente no grupo: ${newChat.name} - Solicitado pelo dono`);
                    
                } catch (joinError) {
                    console.error('❌ Erro ao entrar no grupo automaticamente:', joinError);
                    
                    if (joinError.message.includes('invite link expired')) {
                        await loadingMsg.edit('❌ Link do grupo expirado ou inválido!');
                    } else if (joinError.message.includes('already in group')) {
                        await loadingMsg.edit('⚠️ O bot já está neste grupo!');
                    } else {
                        await loadingMsg.edit('❌ Erro ao entrar no grupo. Verifique se o link está correto e válido.');
                    }
                }
                
            } else {
                // Para usuários não-dono, envia solicitação
                const loadingMsg = await message.reply('📤 Enviando solicitação de autorização ao dono...');
                
                try {
                    // Tenta obter informações básicas do grupo
                    let groupInfo = 'Informações não disponíveis';
                    try {
                        // Verifica se o link é válido tentando extrair informações
                        const tempChatId = await client.acceptInvite(inviteCode);
                        const tempChat = await client.getChatById(tempChatId);
                        groupInfo = `📱 *Nome:* ${tempChat.name}\n👥 *Membros:* ${tempChat.participants ? tempChat.participants.length : 'N/A'}`;
                        
                        // Sai imediatamente do grupo para não ficar sem autorização
                        await tempChat.leave();
                    } catch (e) {
                        // Se não conseguir obter info, continua mesmo assim
                    }

                    // Envia solicitação para o dono
                    const requestMessage = `🤝 *SOLICITAÇÃO DE ENTRADA EM GRUPO* 🤝\n\n👤 *Solicitante:* ${userName}\n📱 *Número:* ${userNumber}\n\n📊 *Informações do grupo:*\n${groupInfo}\n\n🔗 *Link:* ${groupLink}\n\n⏰ *Data da solicitação:* ${new Date().toLocaleString('pt-BR')}\n\n❓ *Deseja autorizar a entrada do bot neste grupo?*`;

                    // Envia para o dono
                    await client.sendMessage(config.NumeroDono + '@c.us', requestMessage);

                    // Responde ao usuário
                    await loadingMsg.edit(`✅ *SOLICITAÇÃO ENVIADA!* ✅\n\n📤 *Status:* Solicitação enviada ao dono\n👑 *Dono:* ${config.NickDono}\n📱 *Contato:* ${config.NumeroDono}\n\n⏳ *Aguarde:* O dono analisará sua solicitação\n💬 *Resposta:* Você será notificado do resultado\n\n🤖 *Bot:* ${config.NomeDoBot}`);

                    // Salva a solicitação temporariamente para possível resposta
                    if (!global.joinRequests) global.joinRequests = {};
                    global.joinRequests[userNumber] = {
                        groupLink,
                        inviteCode,
                        userName,
                        userNumber,
                        timestamp: Date.now()
                    };

                    console.log(`📤 Solicitação de entrada enviada - ${userName} (${userNumber}) para grupo: ${groupLink}`);

                } catch (requestError) {
                    console.error('❌ Erro ao enviar solicitação:', requestError);
                    await loadingMsg.edit('❌ Erro interno ao enviar solicitação. Tente novamente mais tarde.');
                }
            }

        } catch (error) {
            console.error('❌ Erro no comando join:', error);
            await message.reply('❌ Erro interno ao processar solicitação. Tente novamente mais tarde.');
        }
    }
};
