// commands/dono/listagp.js
module.exports = {
    name: 'listagp',
    description: 'Lista todos os grupos onde o bot está presente (apenas dono)',
    usage: 'listagp',
    execute: async ({ message, config, client }) => {
        try {
            await message.react('📋');
            
            const loadingMsg = await message.reply('📋 Coletando lista de grupos...');

            const chats = await client.getChats();
            const groups = chats.filter(chat => chat.isGroup);

            if (groups.length === 0) {
                await loadingMsg.edit('📋 O bot não está em nenhum grupo!');
                return;
            }

            let groupsList = `📋 *GRUPOS DO BOT* 📋\n\n📊 *Total:* ${groups.length} grupos\n\n`;

            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                const isOfficial = config.GrupoOficial === group.id._serialized;
                const officialIcon = isOfficial ? '👑' : '📱';
                const officialLabel = isOfficial ? ' (OFICIAL)' : '';
                
                groupsList += `${officialIcon} *${i + 1}.* ${group.name}${officialLabel}\n`;
                groupsList += `🆔 ${group.id._serialized}\n`;
                groupsList += `👥 ${group.participants.length} membros\n`;
                
                // Conta admins
                const admins = group.participants.filter(p => p.isAdmin);
                groupsList += `🛡️ ${admins.length} admins\n\n`;
            }

            groupsList += `🤖 *Bot:* ${config.NomeDoBot}\n`;
            groupsList += `👑 *Consultado por:* ${config.NickDono}\n`;
            groupsList += `⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(groupsList);
            
            console.log(`📋 Lista de grupos consultada - ${groups.length} grupos encontrados`);

        } catch (error) {
            console.error('❌ Erro ao listar grupos:', error);
            await message.reply('❌ Erro interno ao listar grupos.');
        }
    }
};
