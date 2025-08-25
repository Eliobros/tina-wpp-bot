// commands/admin/fotogp.js
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'fotogp',
    description: 'Altera a foto do grupo (admin)',
    usage: 'fotogp (enviar com imagem) ou responder uma imagem',
    execute: async ({ message, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        let imageMedia = null;

        try {
            // Verifica se é uma resposta a uma mensagem com imagem
            if (message.hasQuotedMsg) {
                const quotedMessage = await message.getQuotedMessage();
                if (quotedMessage.hasMedia && quotedMessage.type === 'image') {
                    imageMedia = await quotedMessage.downloadMedia();
                }
            } 
            // Verifica se a própria mensagem tem imagem
            else if (message.hasMedia && message.type === 'image') {
                imageMedia = await message.downloadMedia();
            }

            // Se não encontrou imagem
            if (!imageMedia) {
                return await message.reply(`❌ *Nenhuma imagem encontrada!*\n\n📖 *Como usar:*\n• Enviar uma imagem + ${config.Prefixo}fotogp\n• Responder uma imagem + ${config.Prefixo}fotogp\n\n💡 *Formatos aceitos:* JPG, PNG, GIF`);
            }

            // Reage com 🖼️
            await message.react('🖼️');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('🖼️ Alterando foto do grupo...');

            // Altera a foto do grupo
            await chat.setPicture(imageMedia);
            
            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Resposta de sucesso
            const response = `✅ *FOTO DO GRUPO ALTERADA!* ✅

🖼️ *Ação:* Foto do grupo atualizada
📱 *Grupo:* ${chat.name}

🛡️ *Alterada por:* ${authorName}
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}

💡 *Dica:* A nova foto pode demorar alguns minutos para aparecer para todos os membros.`;

            await loadingMsg.edit(response);
            
            console.log(`🖼️ Foto do grupo alterada por ${authorName} no grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao alterar foto do grupo:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para alterar a foto do grupo! Verifique se sou administrador.');
            } else if (error.message.includes('invalid media')) {
                await message.reply('❌ Formato de imagem inválido! Use JPG, PNG ou GIF.');
            } else {
                await message.reply('❌ Erro interno ao alterar foto do grupo. Tente novamente mais tarde.');
            }
        }
    }
};
