// commands/admin/nomegp.js
module.exports = {
    name: 'nomegp',
    description: 'Altera o nome do grupo (admin)',
    usage: 'nomegp <novo nome>',
    execute: async ({ message, args, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        // Verifica se foi fornecido um nome
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}nomegp <novo nome>\n\n💡 *Exemplo:* ${config.Prefixo}nomegp Desenvolvedores Unidos\n\n📱 *Nome atual:* ${chat.name}`);
        }

        const newName = args.join(' ');

        // Verifica o tamanho do nome (WhatsApp tem limite)
        if (newName.length > 25) {
            return await message.reply('❌ Nome muito longo! Máximo 25 caracteres.\n\n📊 Seu nome tem: ' + newName.length + ' caracteres');
        }

        if (newName.trim().length === 0) {
            return await message.reply('❌ O nome do grupo não pode estar vazio!');
        }

        // Verifica se o nome é diferente do atual
        if (newName === chat.name) {
            return await message.reply(`⚠️ O nome do grupo já é "${chat.name}"!`);
        }

        try {
            // Reage com ✏️
            await message.react('✏️');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('✏️ Alterando nome do grupo...');

            // Salva o nome antigo
            const oldName = chat.name;

            // Altera o nome do grupo
            await chat.setSubject(newName);
            
            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Resposta de sucesso
            const response = `✅ *NOME DO GRUPO ALTERADO!* ✅

📱 *Nome anterior:* ${oldName}
✨ *Novo nome:* ${newName}

🛡️ *Alterado por:* ${authorName}
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}
📊 *Caracteres:* ${newName.length}/25`;

            await loadingMsg.edit(response);
            
            console.log(`✏️ Nome do grupo alterado por ${authorName}: "${oldName}" → "${newName}"`);

        } catch (error) {
            console.error('❌ Erro ao alterar nome do grupo:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para alterar o nome do grupo! Verifique se sou administrador.');
            } else {
                await message.reply('❌ Erro interno ao alterar nome do grupo. Tente novamente mais tarde.');
            }
        }
    }
};
