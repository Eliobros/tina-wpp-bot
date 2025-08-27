// src/AntiSystemsHandler.js
const { handleAntiMention } = require('../commands/dono/antimention');
const { getGroupFlags } = require('./GroupConfig');

class AntiSystemsHandler {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.setupHandlers();
    }

    setupHandlers() {
        // Handler para mensagens (antilink, antipalavrao, antipv)
        this.client.on('message', async (message) => {
            try {
                await this.handleMessage(message);
            } catch (error) {
                console.error('❌ Erro no handler de anti-sistemas:', error);
            }
        });

        // Handler para chamadas (anticall)
        this.client.on('call', async (call) => {
            try {
                await this.handleCall(call);
            } catch (error) {
                console.error('❌ Erro no handler de anti-call:', error);
            }
        });

        // Handler para usuários entrando no grupo (antifake)
        this.client.on('group_join', async (notification) => {
            try {
                await this.handleGroupJoin(notification);
            } catch (error) {
                console.error('❌ Erro no handler de anti-fake:', error);
            }
        });
    }

    async handleMessage(message) {
        // Ignora mensagens do próprio bot
        if (message.fromMe) return;

        const chat = await message.getChat();
        const contact = await message.getContact();
        const userNumber = contact.number || contact.id.user;

        // Handler para anti-PV
        if (!chat.isGroup && this.config.AntiSystems?.antipv) {
            await this.handleAntiPV(message, contact, userNumber);
            return; // Se bloqueou, não precisa verificar outras coisas
        }

        // Para mensagens em grupos
        if (chat.isGroup) {
            const groupFlags = getGroupFlags(chat.id._serialized);
            // Verifica se usuário tem exceção (dono, admin, vip)
            const hasException = await this.hasException(userNumber, chat);

            // Handler para anti-link
            if ((groupFlags.antilink ?? this.config.AntiSystems?.antilink) && !hasException) {
                const hasLink = await this.detectLink(message.body);
                if (hasLink) {
                    await this.handleAntiLink(message, chat, contact);
                    return;
                }
            }

            // Handler para anti-palavrão
            if ((groupFlags.antipalavrao ?? this.config.AntiSystems?.antipalavrao) && !hasException) {
                const badWord = await this.detectBadWord(message.body);
                if (badWord) {
                    await this.handleAntiPalavrao(message, chat, contact, badWord);
                    return;
                }
            }

            // Handler para anti-mention
            if ((groupFlags.antimention ?? this.config.AntiSystems?.antimention) && !hasException) {
                await handleAntiMention(message, this.config, groupFlags);
            }
        }
    }

    async handleCall(call) {
        // Só funciona se anti-call estiver ativo
        if (!this.config.AntiSystems?.anticall) return;

        const callerNumber = call.from.replace('@c.us', '');

        // Verifica se é o dono
        if (callerNumber === this.config.NumeroDono) return;

        try {
            // Rejeita a chamada
            await call.reject();

            // Envia mensagem de aviso
            const warningMessage = `📞 *CHAMADA BLOQUEADA* 📞\n\n⚠️ *Aviso:* Chamadas não são permitidas!\n🤖 *Bot:* ${this.config.NomeDoBot}\n👑 *Dono:* ${this.config.NickDono}\n\n🚫 *Você será bloqueado automaticamente.*\n\n💡 *Motivo:* Sistema anti-call ativo`;

            await this.client.sendMessage(call.from, warningMessage);

            // Aguarda um pouco e bloqueia
            setTimeout(async () => {
                try {
                    await this.client.setContactBlocked(call.from, true);
                    console.log(`📞 Usuário bloqueado por chamada: ${callerNumber}`);
                } catch (blockError) {
                    console.error('❌ Erro ao bloquear usuário por chamada:', blockError);
                }
            }, 2000);

        } catch (error) {
            console.error('❌ Erro ao processar anti-call:', error);
        }
    }

    async handleGroupJoin(notification) {
        // Só funciona se anti-fake estiver ativo
        const chat = await this.client.getChatById(notification.chatId);
        const groupFlags = chat && chat.isGroup ? getGroupFlags(chat.id._serialized) : {};
        if (!(groupFlags.antifake ?? this.config.AntiSystems?.antifake)) return;

        try {
            const chat = await this.client.getChatById(notification.chatId);
            
            // Verifica se é grupo
            if (!chat.isGroup) return;

            // Pega os usuários que entraram
            const joinedUsers = notification.recipientIds || [];

            for (const userId of joinedUsers) {
                const userNumber = userId.replace('@c.us', '');
                
                // Verifica se não é número de Moçambique (código +258)
                if (!userNumber.startsWith('258')) {
                    try {
                        // Remove o usuário
                        await chat.removeParticipants([userId]);

                        // Envia mensagem explicativa
                        const removalMessage = `🇲🇿 *ANTI-FAKE ATIVO* 🇲🇿\n\n❌ *Usuário removido:* +${userNumber}\n🛡️ *Motivo:* Apenas números de Moçambique são permitidos\n📱 *Código aceito:* +258 (Moçambique)\n\n🤖 *Bot:* ${this.config.NomeDoBot}\n⚙️ *Sistema:* Anti-fake ativo\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

                        await chat.sendMessage(removalMessage);

                        console.log(`🇲🇿 Usuário não-moçambicano removido: +${userNumber} do grupo: ${chat.name}`);

                    } catch (removeError) {
                        console.error(`❌ Erro ao remover usuário não-moçambicano: ${userNumber}`, removeError);
                    }
                }
            }

        } catch (error) {
            console.error('❌ Erro no handler anti-fake:', error);
        }
    }

    async handleAntiPV(message, contact, userNumber) {
        // Não bloqueia o dono
        if (userNumber === this.config.NumeroDono) return;

        try {
            // Envia mensagem de aviso
            const warningMessage = `💬 *MENSAGEM PRIVADA BLOQUEADA* 💬\n\n⚠️ *Aviso:* Mensagens no privado não são permitidas!\n🤖 *Bot:* ${this.config.NomeDoBot}\n👑 *Dono:* ${this.config.NickDono}\n📱 *Contato:* ${this.config.NumeroDono}\n\n🚫 *Você será bloqueado automaticamente.*\n\n💡 *Para contato oficial, fale com o dono.`;

            await message.reply(warningMessage);

            // Aguarda um pouco e bloqueia
            setTimeout(async () => {
                try {
                    await contact.block();
                    console.log(`💬 Usuário bloqueado por PV: ${userNumber}`);
                } catch (blockError) {
                    console.error('❌ Erro ao bloquear usuário por PV:', blockError);
                }
            }, 3000);

        } catch (error) {
            console.error('❌ Erro ao processar anti-PV:', error);
        }
    }

    async handleAntiLink(message, chat, contact) {
        try {
            // Deleta a mensagem
            await message.delete(true);

            // Remove o usuário
            await chat.removeParticipants([contact.id._serialized]);

            // Envia mensagem explicativa
            const userName = contact.pushname || contact.name || contact.number;
            const removalMessage = `🔗 *LINK DETECTADO - USUÁRIO REMOVIDO* 🔗\n\n👤 *Usuário:* ${userName}\n📱 *Número:* ${contact.number}\n🚫 *Motivo:* Envio de link não autorizado\n\n⚠️ *Link detectado mas o usuário é uma realeza, por isso não será banido:*\n👑 Dono do bot\n🛡️ Administradores do grupo\n⭐ Usuários VIP\n\n🤖 *Sistema:* Anti-link ativo\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

            await chat.sendMessage(removalMessage);

            console.log(`🔗 Usuário removido por link: ${userName} (${contact.number}) do grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao processar anti-link:', error);
        }
    }

    async handleAntiPalavrao(message, chat, contact, badWord) {
        try {
            // Deleta a mensagem
            await message.delete(true);

            // Remove o usuário
            await chat.removeParticipants([contact.id._serialized]);

            // Envia mensagem explicativa (sem mostrar a palavra)
            const userName = contact.pushname || contact.name || contact.number;
            const removalMessage = `🤬 *PALAVRA PROIBIDA DETECTADA* 🤬\n\n👤 *Usuário:* ${userName}\n📱 *Número:* ${contact.number}\n🚫 *Motivo:* Uso de linguagem inadequada\n\n👑 *Exceções (não são banidos):*\n• Dono do bot\n• Administradores do grupo\n• Usuários VIP\n\n🤖 *Sistema:* Anti-palavrão ativo\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

            await chat.sendMessage(removalMessage);

            console.log(`🤬 Usuário removido por palavrão: ${userName} (${contact.number}) do grupo: ${chat.name} - Palavra: ${badWord}`);

        } catch (error) {
            console.error('❌ Erro ao processar anti-palavrão:', error);
        }
    }

    async hasException(userNumber, chat) {
        // Verifica se é dono
        if (userNumber === this.config.NumeroDono) return true;

        // Verifica se é VIP
        if (this.config.Vips && this.config.Vips.includes(userNumber)) return true;

        // Verifica se é admin do grupo
        if (chat.isGroup) {
            const participant = chat.participants.find(p => p.id._serialized.includes(userNumber));
            if (participant && participant.isAdmin) return true;
        }

        return false;
    }

    detectLink(text) {
        const linkPatterns = [
            /https?:\/\/[^\s]+/gi,
            /www\.[^\s]+/gi,
            /[^\s]+\.[^\s]{2,}/gi,
            /chat\.whatsapp\.com\/[^\s]+/gi,
            /wa\.me\/[^\s]+/gi,
            /t\.me\/[^\s]+/gi,
            /bit\.ly\/[^\s]+/gi,
            /tinyurl\.com\/[^\s]+/gi
        ];

        return linkPatterns.some(pattern => pattern.test(text));
    }

    detectBadWord(text) {
        if (!this.config.PalavrasProibidas || this.config.PalavrasProibidas.length === 0) {
            return null;
        }

        const textLower = text.toLowerCase();
        
        for (const palavra of this.config.PalavrasProibidas) {
            if (textLower.includes(palavra.toLowerCase())) {
                return palavra;
            }
        }

        return null;
    }
}

module.exports = AntiSystemsHandler;
