// commands/admin/descgp.js
module.exports = {
    name: 'descgp',
    description: 'Altera a descrição do grupo (admin)',
    usage: 'descgp <nova descrição>',
    execute: async ({ message, args, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        // Verifica se foi fornecida uma descrição
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}descgp <nova descrição>\n\n💡 *Exemplo:* ${config.Prefixo}descgp Grupo para discussões sobre tecnologia e programação\n\n📝 *Descrição atual:* ${chat.groupMetadata.desc || 'Sem descrição'}`);
        }

        const newDescription = args.join(' ');

        // Verifica o tamanho da descrição (WhatsApp tem limite)
        if (newDescription.length > 512) {
            return await message.reply('❌ Descrição muito longa! Máximo 512 caracteres.\n\n📊 Sua descrição tem: ' + newDescription.length + ' caracteres');
        }

        try {
            // Reage com 📝
            await message.react('📝');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('📝 Alterando descrição do grupo...');

            // Altera a descrição do grupo
            await chat.setDescription(newDescription);
            
            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Resposta de sucesso
            const response = `✅ *DESCRIÇÃO ALTERADA COM SUCESSO!* ✅

📝 *Nova descrição:*
─────────────────────
${newDescription}
─────────────────────

📱 *Grupo:* ${chat.name}
🛡️ *Alterada por:* ${authorName}
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}
📊 *Caracteres:* ${newDescription.length}/512`;

            await loadingMsg.edit(response);
            
            console.log(`📝 Descrição alterada por ${authorName} no grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao alterar descrição do grupo:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para alterar a descrição do grupo! Verifique se sou administrador.');
            } else {
                await message.reply('❌ Erro interno ao alterar descrição do grupo. Tente novamente mais tarde.');
            }
        }
  g  }
};
