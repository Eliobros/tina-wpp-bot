// src/AbsenceHandler.js
class AbsenceHandler {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.setupHandler();
    }

    setupHandler() {
        this.client.on('message', async (message) => {
            try {
                if (message.fromMe) return; // Ignora mensagens do próprio bot
                
                const chat = await message.getChat();
                if (!chat.isGroup) return; // Só funciona em grupos
                
                await this.checkMentions(message, chat);
                
            } catch (error) {
                console.error('Erro no handler de ausência:', error);
            }
        });
    }

    async checkMentions(message, chat) {
        // Verifica se há menções na mensagem
        if (!message.mentionedIds || message.mentionedIds.length === 0) return;
        
        const groupId = chat.id._serialized;
        
        for (const mentionedId of message.mentionedIds) {
            const userNumber = mentionedId.replace('@c.us', '');
            const userKey = `${userNumber}@${groupId}`;
            
            // Verifica se o usuário mencionado está ausente
            if (this.config.UsuariosAusentes && this.config.UsuariosAusentes[userKey] && this.config.UsuariosAusentes[userKey].ausente) {
                
                const ausenteInfo = this.config.UsuariosAusentes[userKey];
                const diasAusente = Math.floor((Date.now() - ausenteInfo.dataAusencia) / (1000 * 60 * 60 * 24));
                const dataFormatada = new Date(ausenteInfo.dataAusencia).toLocaleString('pt-BR');
                
                // Pega quem fez a menção
                const contact = await message.getContact();
                const authorName = contact.pushname || contact.name || 'Usuário';
                
                const ausenteResponse = `💤 *USUÁRIO AUSENTE* 💤\n\nOlá ${authorName}, o ${ausenteInfo.userName} está ausente.\n\nEle está: ${ausenteInfo.motivo}\nDesde: ${dataFormatada}\n⏰ Há ${diasAusente === 0 ? 'menos de 1 dia' : `${diasAusente} dia(s)`}`;
                
                await message.reply(ausenteResponse);
                
                console.log(`💤 Aviso de ausência enviado: ${ausenteInfo.userName} mencionado por ${authorName}`);
                
                // Para evitar spam, só responde à primeira menção se houver várias
                break;
            }
        }
    }
}

module.exports = AbsenceHandler;
