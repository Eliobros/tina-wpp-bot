// src/JoinAuthHandler.js
class JoinAuthHandler {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.setupHandler();
    }

    setupHandler() {
        // Handler para reações do dono em solicitações
        this.client.on('message_reaction', async (reaction) => {
            try {
                // Verifica se é uma reação do dono
                if (reaction.senderId !== this.config.NumeroDono + '@c.us') return;
                
                const message = reaction.message;
                
                // Verifica se é uma mensagem de solicitação de join
                if (!message.body.includes('SOLICITAÇÃO DE ENTRADA EM GRUPO')) return;
                
                await this.handleJoinReaction(reaction, message);
                
            } catch (error) {
                console.error('❌ Erro no handler de autorização:', error);
            }
        });

        // Handler para mensagens do dono com comandos de autorização
        this.client.on('message', async (message) => {
            try {
                // Só processa mensagens do dono
                if (message.from !== this.config.NumeroDono + '@c.us') return;
                
                const content = message.body.toLowerCase();
                
                // Verifica comandos de autorização
                if (content.startsWith('aceitar ') || content.startsWith('recusar ')) {
                    await this.handleAuthCommand(message);
                }
                
            } catch (error) {
                console.error('❌ Erro no handler de comando de auth:', error);
            }
        });
    }

    async handleJoinReaction(reaction, message) {
        const emoji = reaction.reaction;
        
        if (emoji === '✅') {
            await this.acceptJoinRequest(message);
        } else if (emoji === '❌') {
            await this.rejectJoinRequest(message, 'Solicitação rejeitada pelo dono');
        }
    }

    async handleAuthCommand(message) {
        const args = message.body.split(' ');
        const command = args[0].toLowerCase();
        
        if (command === 'aceitar') {
            await this.acceptJoinRequest(message);
        } else if (command === 'recusar') {
            const reason = args.slice(1).join(' ') || 'Solicitação rejeitada pelo dono';
            await this.rejectJoinRequest(message, reason);
        }
    }

    async acceptJoinRequest(message) {
        try {
            // Extrai informações da mensagem de solicitação
            const requestInfo = this.extractRequestInfo(message.body);
            if (!requestInfo) {
                await message.reply('❌ Não foi possível processar a solicitação.');
                return;
            }

            const loadingMsg = await message.reply('⏳ Processando autorização...');

            // Tenta entrar no grupo
            try {
                const chatId = await this.client.acceptInvite(requestInfo.inviteCode);
                const newChat = await this.client.getChatById(chatId);
                
                // Sucesso - notifica o dono
                await loadingMsg.edit(`✅ *AUTORIZAÇÃO ACEITA!* ✅\n\n📱 *Grupo:* ${newChat.name}\n👤 *Solicitante:* ${requestInfo.userName}\n📞 *Número:* ${requestInfo.userNumber}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n🎉 Bot entrou no grupo com sucesso!`);
                
                // Notifica o usuário
                const userMessage = `✅ *SOLICITAÇÃO ACEITA!* ✅\n\n🎉 *Boa notícia:* Sua solicitação foi aceita!\n📱 *Grupo:* ${newChat.name}\n👑 *Autorizado por:* ${this.config.NickDono}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n🤖 *${this.config.NomeDoBot}* agora está disponível no grupo!\n\n💡 Use ${this.config.Prefixo}menu para ver os comandos.`;
                
                await this.client.sendMessage(requestInfo.userNumber + '@c.us', userMessage);
                
                console.log(`✅ Autorização aceita: ${requestInfo.userName} - Grupo: ${newChat.name}`);
                
            } catch (joinError) {
                console.error('❌ Erro ao entrar no grupo:', joinError);
                
                let errorMsg = '❌ Erro ao entrar no grupo: ';
                if (joinError.message.includes('invite link expired')) {
                    errorMsg += 'Link expirado';
                } else if (joinError.message.includes('already in group')) {
                    errorMsg += 'Bot já está no grupo';
                } else {
                    errorMsg += 'Link inválido ou grupo inacessível';
                }
                
                await loadingMsg.edit(errorMsg);
                
                // Notifica o usuário do erro
                await this.client.sendMessage(requestInfo.userNumber + '@c.us', 
                    `❌ *ERRO NA AUTORIZAÇÃO* ❌\n\n😔 *Problema:* ${errorMsg}\n👑 *Dono:* ${this.config.NickDono}\n\n💡 *Solução:* Verifique se o link está correto e válido, depois faça uma nova solicitação.`);
            }

        } catch (error) {
            console.error('❌ Erro ao aceitar solicitação:', error);
            await message.reply('❌ Erro interno ao processar autorização.');
        }
    }

    async rejectJoinRequest(message, reason) {
        try {
            const requestInfo = this.extractRequestInfo(message.body);
            if (!requestInfo) {
                await message.reply('❌ Não foi possível processar a rejeição.');
                return;
            }

            // Notifica o dono
            await message.reply(`❌ *SOLICITAÇÃO REJEITADA* ❌\n\n👤 *Solicitante:* ${requestInfo.userName}\n📞 *Número:* ${requestInfo.userNumber}\n💬 *Motivo:* ${reason}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`);

            // Notifica o usuário
            let userMessage = `❌ *SOLICITAÇÃO REJEITADA* ❌\n\n😔 *Sua solicitação foi rejeitada*\n👑 *Por:* ${this.config.NickDono}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
            
            if (reason && reason !== 'Solicitação rejeitada pelo dono') {
                userMessage += `\n\n💬 *Motivo:* ${reason}`;
            }
            
            userMessage += `\n\n💡 *Você pode:*\n• Tentar novamente mais tarde\n• Entrar em contato com o dono: ${this.config.NumeroDono}`;

            await this.client.sendMessage(requestInfo.userNumber + '@c.us', userMessage);
            
            console.log(`❌ Solicitação rejeitada: ${requestInfo.userName} - Motivo: ${reason}`);

        } catch (error) {
            console.error('❌ Erro ao rejeitar solicitação:', error);
            await message.reply('❌ Erro interno ao processar rejeição.');
        }
    }

    extractRequestInfo(messageBody) {
        try {
            // Extrai informações usando regex
            const userNameMatch = messageBody.match(/\*Solicitante:\* (.+)/);
            const userNumberMatch = messageBody.match(/\*Número:\* (\d+)/);
            const linkMatch = messageBody.match(/\*Link:\* (https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+)/);
            
            if (!userNameMatch || !userNumberMatch || !linkMatch) {
                return null;
            }
            
            const inviteCodeMatch = linkMatch[1].match(/https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
            
            return {
                userName: userNameMatch[1],
                userNumber: userNumberMatch[1],
                groupLink: linkMatch[1],
                inviteCode: inviteCodeMatch ? inviteCodeMatch[1] : null
            };
            
        } catch (error) {
            console.error('❌ Erro ao extrair informações:', error);
            return null;
        }
    }
}

module.exports = JoinAuthHandler;
