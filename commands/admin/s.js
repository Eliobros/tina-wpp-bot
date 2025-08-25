// commands/admin/s.js
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 's',
    description: 'Converte imagem em sticker (admin)',
    usage: 's (responder uma imagem) ou enviar imagem + s',
    execute: async ({ message, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        let imageMedia = null;
        let sourceMessage = null;

        try {
            // Verifica se é uma resposta a uma mensagem com imagem
            if (message.hasQuotedMsg) {
                const quotedMessage = await message.getQuotedMessage();
                if (quotedMessage.hasMedia && (quotedMessage.type === 'image' || quotedMessage.type === 'video')) {
                    imageMedia = await quotedMessage.downloadMedia();
                    sourceMessage = quotedMessage;
                }
            } 
            // Verifica se a própria mensagem tem imagem
            else if (message.hasMedia && (message.type === 'image' || message.type === 'video')) {
                imageMedia = await message.downloadMedia();
                sourceMessage = message;
            }

            // Se não encontrou imagem
            if (!imageMedia) {
                return await message.reply(`❌ *Nenhuma imagem encontrada!*\n\n📖 *Como usar:*\n• Enviar uma imagem + ${config.Prefixo}s\n• Responder uma imagem + ${config.Prefixo}s\n\n💡 *Formatos aceitos:* JPG, PNG, GIF, MP4 (vídeo curto)`);
            }

            // Verifica se é um formato válido
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
            if (!validTypes.includes(imageMedia.mimetype)) {
                return await message.reply('❌ Formato não suportado! Use JPG, PNG, GIF, WEBP ou MP4.');
            }

            // Verifica o tamanho do arquivo (WhatsApp tem limite para stickers)
            if (imageMedia.data.length > 1024 * 1024) { // 1MB
                return await message.reply('❌ Arquivo muito grande! Stickers devem ter menos de 1MB.');
            }

            // Reage com 🎨
            await message.react('🎨');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('🎨 Convertendo em sticker...');

            // Pega informações de quem executou
            const admin = await message.getContact();
            const adminName = admin.pushname || admin.name || 'Admin';

            // Cria o sticker
            await client.sendMessage(chat.id._serialized, imageMedia, {
                sendMediaAsSticker: true,
                stickerAuthor: config.NomeDoBot,
                stickerName: `By ${adminName}`,
                stickerCategories: ['🤖', '📱']
            });

            // Remove a mensagem de loading
            await loadingMsg.delete();
            
            // Reage com ✅ na mensagem original
            await sourceMessage.react('✅');

            console.log(`🎨 Sticker criado por ${adminName} no grupo ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao criar sticker:', error);
            
            if (error.message.includes('invalid media')) {
                await message.reply('❌ Formato de mídia inválido para sticker!');
            } else if (error.message.includes('too large')) {
                await message.reply('❌ Arquivo muito grande para sticker! Máximo 1MB.');
            } else if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para enviar stickers!');
            } else {
                await message.reply('❌ Erro interno ao criar sticker. Tente novamente mais tarde.');
            }
        }
    }
};
