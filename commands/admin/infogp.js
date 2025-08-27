// commands/admin/infogp.js
module.exports = {
    name: 'infogp',
    description: 'Mostra informações completas do grupo (admin)',
    usage: 'infogp',
    execute: async ({ message, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            // Reage com 📊
            await message.react('📊');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('📊 Coletando informações do grupo...');

            // Coleta informações básicas
            const groupName = chat.name;
            const groupDescription = chat.groupMetadata.desc || 'Sem descrição';
            const groupId = chat.id._serialized.split('@')[0];
            const totalMembers = chat.participants.length;
            
            // Conta admins
            const admins = chat.participants.filter(p => p.isAdmin);
            const totalAdmins = admins.length;
            
            // Data de criação (se disponível)
            const creationTime = chat.groupMetadata.creation ? 
                new Date(chat.groupMetadata.creation * 1000).toLocaleString('pt-BR') : 
                'Não disponível';
            
            // Verifica se tem foto do grupo
            let hasPhoto = 'Não';
            try {
                const profilePic = await chat.getProfilePicUrl();
                hasPhoto = profilePic ? 'Sim' : 'Não';
            } catch (e) {
                hasPhoto = 'Não disponível';
            }

            // Configurações do grupo
            const settings = {
                messagesAdminsOnly: chat.groupMetadata.restrict ? 'Apenas admins' : 'Todos podem enviar',
                editGroupInfoAdminsOnly: chat.groupMetadata.announce ? 'Apenas admins' : 'Todos podem editar',
                addMembersAdminsOnly: 'Configuração não disponível' // wwebjs limitation
            };

            // Lista dos primeiros 10 admins
            let adminsList = '';
            for (let i = 0; i < Math.min(admins.length, 10); i++) {
                try {
                    const admin = admins[i];
                    const contact = await client.getContactById(admin.id._serialized);
                    const name = contact.pushname || contact.name || admin.id.user;
                    adminsList += `• ${name}\n`;
                } catch (e) {
                    adminsList += `• ${admins[i].id.user}\n`;
                }
            }
            
            if (admins.length > 10) {
                adminsList += `... e mais ${admins.length - 10} admins`;
            }

            // Monta a resposta
            const response = `📊 *INFORMAÇÕES DO GRUPO* 📊

📱 *Nome:* ${groupName}
🆔 *ID:* ${groupId}
📅 *Criado em:* ${creationTime}

📝 *Descrição:*
─────────────────────
${groupDescription}
─────────────────────

👥 *ESTATÍSTICAS:*
• Total de membros: ${totalMembers}
• Administradores: ${totalAdmins}
• Membros comuns: ${totalMembers - totalAdmins}

🖼️ *Foto do grupo:* ${hasPhoto}

⚙️ *CONFIGURAÇÕES:*
• Enviar mensagens: ${settings.messagesAdminsOnly}
• Editar info do grupo: ${settings.editGroupInfoAdminsOnly}

👑 *ADMINISTRADORES:*
${adminsList}

🤖 *Consultado por:* ${config.NomeDoBot}
⏰ *Data da consulta:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(response);
            
            console.log(`📊 Informações do grupo consultadas: ${groupName}`);

        } catch (error) {
            console.error('❌ Erro ao obter informações do grupo:', error);
            await message.reply('❌ Erro interno ao obter informações do grupo. Tente novamente mais tarde.');
        }
    }
};
