// commands/admin/grupoid.js
module.exports = {
    name: 'grupoid',
    description: 'Mostra o ID do grupo atual (admin)',
    usage: 'grupoid',
    execute: async ({ message, config, chat }) => {
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            const response = `🆔 *ID DO GRUPO* 🆔\n\n📱 *Nome:* ${chat.name}\n🆔 *ID:* ${chat.id._serialized}\n👥 *Membros:* ${chat.participants.length}\n📅 *Criado em:* ${chat.groupMetadata.creation ? new Date(chat.groupMetadata.creation * 1000).toLocaleString('pt-BR') : 'Não disponível'}\n\n💡 *Este ID é único e pode ser usado para identificar o grupo*\n\n🛡️ *Consultado por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

            await message.reply(response);
            
            console.log(`🆔 ID do grupo consultado: ${chat.name} por ${authorName}`);

        } catch (error) {
            console.error('❌ Erro ao obter ID do grupo:', error);
            await message.reply('❌ Erro interno ao obter ID do grupo.');
        }
    }
};
