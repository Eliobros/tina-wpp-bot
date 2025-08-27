// commands/dono/delvip.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'delvip',
    description: 'Remove um usuário da lista VIP (apenas dono)',
    usage: 'delvip @usuario ou delvip <número> ou responder mensagem',
    execute: async ({ message, args, client, config }) => {
        let userToRemove = null;
        let userName = '';

        try {
            // Verifica se é uma resposta a uma mensagem
            if (message.hasQuotedMsg) {
                const quotedMessage = await message.getQuotedMessage();
                userToRemove = quotedMessage.from.replace('@c.us', '');
                const contact = await client.getContactById(quotedMessage.from);
                userName = contact.pushname || contact.name || userToRemove;
            } 
            // Verifica se foi mencionado alguém
            else if (message.mentionedIds && message.mentionedIds.length > 0) {
                userToRemove = message.mentionedIds[0].replace('@c.us', '');
                const contact = await client.getContactById(message.mentionedIds[0]);
                userName = contact.pushname || contact.name || userToRemove;
            }
            // Verifica se foi passado um número como argumento
            else if (args.length > 0) {
                const number = args.join(' ').replace(/[^0-9]/g, '');
                if (number.length > 0) {
                    userToRemove = number;
                    try {
                        const contact = await client.getContactById(number + '@c.us');
                        userName = contact.pushname || contact.name || number;
                    } catch {
                        userName = number;
                    }
                }
            }

            // Se não encontrou usuário para remover
            if (!userToRemove) {
                return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Formas de usar:*\n• ${config.Prefixo}delvip @usuario\n• ${config.Prefixo}delvip 5511999999999\n• Responder mensagem + ${config.Prefixo}delvip\n\n💡 *Exemplo:* ${config.Prefixo}delvip @5511999999999`);
            }

            // Verifica se é VIP
            if (!config.Vips.includes(userToRemove)) {
                return await message.reply(`⚠️ ${userName} não está na lista VIP!`);
            }

            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Remove o VIP
            configData.Vips = configData.Vips.filter(vip => vip !== userToRemove);
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            config.Vips = config.Vips.filter(vip => vip !== userToRemove);
            
            // Mensagem de sucesso
            const successMessage = `✅ *VIP removido com sucesso!*\n\n⭐ *Ex-VIP:* ${userName}\n📱 *Número:* ${userToRemove}\n👑 *Removido por:* ${config.NickDono}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n📉 VIP removido da lista.`;
            
            await message.reply(successMessage);
            
            console.log(`❌ VIP removido: ${userName} (${userToRemove}) pelo dono`);

        } catch (error) {
            console.error('❌ Erro ao remover VIP:', error);
            await message.reply('❌ Erro interno ao remover VIP! Verifique os logs.');
        }
    }
};
