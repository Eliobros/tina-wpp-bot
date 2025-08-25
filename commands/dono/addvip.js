// commands/dono/addvip.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addvip',
    description: 'Adiciona um usuário à lista VIP (apenas dono)',
    usage: 'addvip @usuario ou addvip <número> ou responder mensagem',
    execute: async ({ message, args, client, config }) => {
        let userToAdd = null;
        let userName = '';

        try {
            // Garante que config.Vips exista e seja array
            if (!Array.isArray(config.Vips)) {
                config.Vips = [];
            }

            // Verifica se é uma resposta a uma mensagem
            if (message.hasQuotedMsg) {
                const quotedMessage = await message.getQuotedMessage();
                userToAdd = quotedMessage.from.replace('@c.us', '');
                const contact = await client.getContactById(quotedMessage.from);
                userName = contact.pushname || contact.name || userToAdd;
            } 
            // Verifica se foi mencionado alguém
            else if (message.mentionedIds && message.mentionedIds.length > 0) {
                userToAdd = message.mentionedIds[0].replace('@c.us', '');
                const contact = await client.getContactById(message.mentionedIds[0]);
                userName = contact.pushname || contact.name || userToAdd;
            }
            // Verifica se foi passado um número como argumento
            else if (args.length > 0) {
                const number = args.join(' ').replace(/[^0-9]/g, '');
                if (number.length > 0) {
                    userToAdd = number;
                    try {
                        const contact = await client.getContactById(number + '@c.us');
                        userName = contact.pushname || contact.name || number;
                    } catch {
                        userName = number;
                    }
                }
            }

            // Se não encontrou usuário para adicionar
            if (!userToAdd) {
                return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Formas de usar:*\n• ${config.Prefixo}addvip @usuario\n• ${config.Prefixo}addvip 5511999999999\n• Responder mensagem + ${config.Prefixo}addvip\n\n💡 *Exemplo:* ${config.Prefixo}addvip @5511999999999`);
            }

            // Verifica se não está tentando adicionar o próprio dono
            if (userToAdd === config.NumeroDono) {
                return await message.reply(`⚠️ O dono ${config.NickDono} já tem todas as permissões! Não precisa ser VIP.`);
            }

            // Verifica se já é VIP
            if (config.Vips.includes(userToAdd)) {
                return await message.reply(`⚠️ ${userName} já está na lista VIP!`);
            }

            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Garante que também existe no JSON
            if (!Array.isArray(configData.Vips)) {
                configData.Vips = [];
            }

            // Adiciona o VIP
            configData.Vips.push(userToAdd);
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            config.Vips.push(userToAdd);
            
            // Mensagem de sucesso
            const successMessage = `✅ *VIP adicionado com sucesso!*\n\n⭐ *Novo VIP:* ${userName}\n📱 *Número:* ${userToAdd}\n👑 *Adicionado por:* ${config.NickDono}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n🎉 Parabéns pela promoção a VIP!`;
            
            await message.reply(successMessage);
            
            console.log(`⭐ VIP adicionado: ${userName} (${userToAdd}) pelo dono`);

        } catch (error) {
            console.error('❌ Erro ao adicionar VIP:', error);
            await message.reply('❌ Erro interno ao adicionar VIP! Verifique os logs.');
        }
    }
};
