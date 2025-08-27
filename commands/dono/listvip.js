// commands/dono/listvip.js
module.exports = {
    name: 'listvip',
    description: 'Lista todos os usuários VIP (apenas dono)',
    usage: 'listvip',
    execute: async ({ message, client, config }) => {
        try {
            // Verifica se há VIPs
            if (!config.Vips || config.Vips.length === 0) {
                return await message.reply(`📋 *LISTA VIP*\n\n⚠️ Nenhum VIP cadastrado!\n\n💡 Use ${config.Prefixo}addvip para adicionar VIPs.`);
            }

            // Monta a lista de VIPs
            let vipList = `⭐ *LISTA DE USUÁRIOS VIP* ⭐\n`;
            vipList += `📊 Total: ${config.Vips.length}\n\n`;

            const mentions = [];

            for (let i = 0; i < config.Vips.length; i++) {
                const vipNumber = config.Vips[i];
                let vipName = vipNumber;
                
                try {
                    const contact = await client.getContactById(vipNumber + '@c.us');
                    vipName = contact.pushname || contact.name || vipNumber;
                    mentions.push(vipNumber + '@c.us');
                } catch (error) {
                    // Se não conseguir pegar o contato, usa só o número
                }
                
                vipList += `⭐ *${i + 1}.* ${vipName}\n`;
                vipList += `📱 @${vipNumber}\n\n`;
            }

            vipList += `👑 *Gerenciado por:* ${config.NickDono}\n`;
            vipList += `🤖 *Bot:* ${config.NomeDoBot}\n`;
            vipList += `⏰ *Consultado em:* ${new Date().toLocaleString('pt-BR')}`;

            // Envia a lista mencionando todos os VIPs
            await message.reply(vipList, null, { mentions });
            
            console.log(`📋 Lista VIP consultada (${config.Vips.length} VIPs)`);

        } catch (error) {
            console.error('❌ Erro ao listar VIPs:', error);
            await message.reply('❌ Erro interno ao listar VIPs! Verifique os logs.');
        }
    }
};
