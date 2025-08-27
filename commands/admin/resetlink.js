// commands/admin/linkgp.js
module.exports = {
    name: 'linkgp',
    description: 'Mostra o link de convite do grupo (admin)',
    usage: 'linkgp',
    execute: async ({ message, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            // Reage com 🔗
            await message.react('🔗');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('🔗 Gerando link do grupo...');

            // Obtém o código de convite
            const inviteCode = await chat.getInviteCode();
            
            if (!inviteCode) {
                await loadingMsg.edit('❌ Não foi possível obter o link do grupo. Verifique se o grupo permite convites.');
                return;
            }

            // Monta o link completo
            const groupLink = `https://chat.whatsapp.com/${inviteCode}`;
            
            // Informações do grupo
            const groupInfo = `🔗 *LINK DO GRUPO* 🔗

📱 *Nome:* ${chat.name}
👥 *Membros:* ${chat.participants.length}
🆔 *ID:* ${chat.id._serialized.split('@')[0]}

🔗 *Link de convite:*
${groupLink}

⚠️ *Aviso:* Compartilhe com responsabilidade!
🛡️ *Gerado por:* Admin
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(groupInfo);
            
            console.log(`🔗 Link do grupo gerado: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao gerar link do grupo:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para gerar link do grupo! Verifique se sou administrador.');
            } else {
                await message.reply('❌ Erro interno ao gerar link do grupo. Tente novamente mais tarde.');
            }
        }
    }
};
