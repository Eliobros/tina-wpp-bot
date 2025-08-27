// commands/dono/antimention.js
const fs = require('fs');
const path = require('path');

// Memória temporária para avisos
const warnedUsers = {}; // chave: `${chatId}_${userId}`

module.exports = {
    name: 'antimention',
    description: 'Ativa/desativa o sistema anti-menção (avisa e depois remove usuários que mencionarem o grupo) (apenas dono)',
    usage: 'antimention 1 (ativar) ou antimention 0 (desativar)',
    execute: async ({ message, args, config }) => {
        if (args.length === 0 || (args[0] !== '1' && args[0] !== '0')) {
            const currentStatus = config.AntiSystems?.antimention ? 'Ativado ✅' : 'Desativado ❌';
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:*\n• ${config.Prefixo}antimention 1 *(ativar)*\n• ${config.Prefixo}antimention 0 *(desativar)*\n\n💡 *Status atual:* ${currentStatus}`);
        }

        const novoStatus = args[0] === '1';

        try {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                return await message.reply('❌ Use este comando dentro do grupo que deseja configurar.');
            }
            const { getGroupFlags, setGroupFlag } = require('../../src/GroupConfig');
            const current = getGroupFlags(chat.id._serialized).antimention;
            if (current === novoStatus) {
                const statusText = novoStatus ? 'ativado' : 'desativado';
                return await message.reply(`⚠️ O anti-menção já está ${statusText} neste grupo!`);
            }
            setGroupFlag(chat.id._serialized, 'antimention', novoStatus);

            const statusText = novoStatus ? 'ativado ✅' : 'desativado ❌';
            const emoji = novoStatus ? '🚫' : '💬';

            await message.reply(`${emoji} *ANTI-MENÇÃO ${statusText.toUpperCase()}* ${emoji}\n👑 Configurado por: ${config.NickDono}`);

            console.log(`${emoji} Anti-menção ${statusText} pelo dono`);

        } catch (error) {
            console.error('❌ Erro ao alterar configuração anti-menção:', error);
            await message.reply('❌ Erro interno ao alterar configuração! Verifique os logs.');
        }
    }
};

// Função para processar mensagens de grupo
async function handleAntiMention(message, config, groupFlags = {}) {
    try {
        const enabled = (groupFlags.antimention ?? config.AntiSystems?.antimention);
        if (!enabled) return;
        if (!message.from.includes("@g.us")) return;

        const chat = await message.getChat();
        const author = await message.getContact();
        const authorId = author.id._serialized;

        // Ignorar admins e VIPs
        const isAdmin = chat.participants.some(p => p.id._serialized === authorId && p.isAdmin);
        const isVIP = (config.Vips || []).includes(authorId);
        if (isAdmin || isVIP) return;

        const mentions = await message.getGroupMentions();
        const groupMentioned = mentions.some(contact => contact.id._serialized === chat.id._serialized);
        if (!groupMentioned) return;

        const key = `${chat.id._serialized}_${authorId}`;

        if (!warnedUsers[key]) {
            // Primeiro aviso
            await chat.sendMessage(`⚠️ @${author.id.user}, você não pode mencionar o grupo! Na próxima vez, você será removido.`, {
                mentions: [author]
            });
            warnedUsers[key] = true;
            console.log(`⚠️ Usuário ${author.pushname || author.id.user} recebeu aviso de menção no grupo ${chat.name}.`);
        } else {
            // Já avisado, remove do grupo
            await chat.removeParticipants([authorId]);
            await chat.sendMessage(`🚨 @${author.id.user} foi removido por tentar mencionar o grupo novamente!`, {
                mentions: [author]
            });
            console.log(`🚨 Usuário ${author.pushname || author.id.user} removido do grupo ${chat.name} por mencionar o grupo novamente.`);
            delete warnedUsers[key]; // reseta aviso
        }

    } catch (err) {
        console.error("Erro ao processar menção de status:", err);
    }
}

module.exports.handleAntiMention = handleAntiMention;
