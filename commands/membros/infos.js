// commands/membros/info.js
module.exports = {
    name: 'info',
    description: 'Mostra informações do bot',
    execute: async ({ message, config, contact }) => {
        const info = `
🤖 *${config.NomeDoBot}*
👑 Dono: ${config.NickDono}
⚡ Prefixo: ${config.Prefixo}
👤 Usuário: ${contact.pushname || 'Desconhecido'}

📱 Bot desenvolvido com wwebjs
        `.trim();
        
        await message.reply(info);
    }
};

