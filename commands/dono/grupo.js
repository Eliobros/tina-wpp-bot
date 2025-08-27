// commands/admin/grupo.js
module.exports = {
    name: 'grupo',
    description: 'Abre ou fecha o grupo (admin)',
    usage: 'grupo a (abrir) ou grupo f (fechar)',
    execute: async ({ message, args, client, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        // Verifica se foi fornecido argumento
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:*\n• ${config.Prefixo}grupo a *(abrir grupo)*\n• ${config.Prefixo}grupo f *(fechar grupo)*\n\n💡 *Status atual:* ${chat.groupMetadata.restrict ? 'Fechado 🔒' : 'Aberto 🔓'}`);
        }

        const action = args[0].toLowerCase();

        try {
            if (action === 'a' || action === 'abrir') {
                // Abre o grupo (permite membros enviarem mensagens)
                await chat.setMessagesAdminsOnly(false);
                
                await message.reply(`🔓 *Grupo aberto com sucesso!*\n\n✅ *Status:* Aberto para todos\n👥 *Ação:* Todos podem enviar mensagens\n👑 *Por:* ${config.NickDono}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`);
                
                console.log(`🔓 Grupo aberto pelo dono: ${chat.name}`);
                
            } else if (action === 'f' || action === 'fechar') {
                // Fecha o grupo (apenas admins podem enviar mensagens)
                await chat.setMessagesAdminsOnly(true);
                
                await message.reply(`🔒 *Grupo fechado com sucesso!*\n\n✅ *Status:* Fechado para admins\n🛡️ *Ação:* Apenas admins podem enviar mensagens\n👑 *Por:* ${config.NickDono}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`);
                
                console.log(`🔒 Grupo fechado pelo dono: ${chat.name}`);
                
            } else {
                await message.reply(`❌ *Opção inválida!*\n\n📖 *Opções válidas:*\n• \`a\` ou \`abrir\` - Abre o grupo\n• \`f\` ou \`fechar\` - Fecha o grupo\n\n💡 *Exemplo:* ${config.Prefixo}grupo a`);
            }

        } catch (error) {
            console.error('❌ Erro ao alterar configuração do grupo:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Não tenho permissão para alterar as configurações do grupo! Verifique se sou administrador.');
            } else {
                await message.reply('❌ Erro interno ao alterar configurações do grupo. Tente novamente mais tarde.');
            }
        }
    }
};
