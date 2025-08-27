// commands/admin/antilink.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'antilink',
    description: 'Ativa/desativa o sistema anti-link do grupo (admin)',
    usage: 'antilink 1 (ativar) ou antilink 0 (desativar)',
    execute: async ({ message, args, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        // Verifica se foi fornecido argumento
        if (args.length === 0 || (args[0] !== '1' && args[0] !== '0')) {
            const { getGroupFlags } = require('../../src/GroupConfig');
            const groupFlags = getGroupFlags(chat.id._serialized);
            const currentStatus = (groupFlags.antilink ?? config.AntiSystems?.antilink) ? 'Ativado ✅' : 'Desativado ❌';
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:*\n• ${config.Prefixo}antilink 1 *(ativar)*\n• ${config.Prefixo}antilink 0 *(desativar)*\n\n💡 *Status neste grupo:* ${currentStatus}\n\n🛡️ *Função:* Remove usuários que enviam links (exceto dono, admins e VIPs)`);
        }

        const novoStatus = args[0] === '1';

        try {
            // Verifica se já está no status desejado por grupo
            const { getGroupFlags, setGroupFlag } = require('../../src/GroupConfig');
            const current = getGroupFlags(chat.id._serialized).antilink;
            if (current === novoStatus) {
                const statusText = novoStatus ? 'ativado' : 'desativado';
                return await message.reply(`⚠️ O anti-link já está ${statusText} neste grupo!`);
            }
            // Atualiza flag do grupo
            setGroupFlag(chat.id._serialized, 'antilink', novoStatus);
            
            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Mensagem de sucesso
            const statusText = novoStatus ? 'ativado ✅' : 'desativado ❌';
            const emoji = novoStatus ? '🛡️' : '🔓';
            
            const response = `${emoji} *ANTI-LINK ${statusText.toUpperCase()}* ${emoji}\n\n📱 *Grupo:* ${chat.name}\n🔗 *Sistema:* ${statusText}\n\n${novoStatus ? '⚠️ *Aviso:* Usuários que enviarem links serão removidos automaticamente!\n\n👑 *Exceções:*\n• Dono do bot\n• Administradores do grupo\n• Usuários VIP\n\n💡 *Tipos de links detectados:*\n• Links do WhatsApp\n• URLs em geral\n• Links encurtados' : '💡 *Resultado:* Usuários podem enviar links livremente'}\n\n🛡️ *Configurado por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
            
            await message.reply(response);
            
            console.log(`${emoji} Anti-link ${statusText} por ${authorName} no grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao alterar configuração anti-link:', error);
            await message.reply('❌ Erro interno ao alterar configuração! Verifique os logs.');
        }
    }
};
