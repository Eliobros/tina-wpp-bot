// commands/admin/listpalavra.js
module.exports = {
    name: 'listpalavra',
    description: 'Lista todas as palavras proibidas cadastradas (admin)',
    usage: 'listpalavra',
    execute: async ({ message, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            // Verifica se há palavras proibidas
            if (!config.PalavrasProibidas || config.PalavrasProibidas.length === 0) {
                return await message.reply(`📋 *LISTA DE PALAVRAS PROIBIDAS* 📋\n\n⚠️ Nenhuma palavra proibida cadastrada!\n\n💡 *Para adicionar:* ${config.Prefixo}addpalavra <palavra>\n🛡️ *Status do sistema:* ${config.AntiSystems?.antipalavrao ? 'Ativado ✅' : 'Desativado ❌'}`);
            }

            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Monta a lista de palavras (censurada para privacidade)
            let palavrasList = `🤬 *LISTA DE PALAVRAS PROIBIDAS* 🤬\n`;
            palavrasList += `📊 Total: ${config.PalavrasProibidas.length}\n`;
            palavrasList += `📱 Grupo: ${chat.name}\n\n`;
            palavrasList += `🔍 *Palavras cadastradas:*\n`;

            // Lista as palavras (censuradas)
            for (let i = 0; i < config.PalavrasProibidas.length; i++) {
                const palavra = config.PalavrasProibidas[i];
                // Censura a palavra mostrando apenas primeira e última letra
                const palavraCensurada = palavra.length > 2 ? 
                    palavra[0] + '*'.repeat(palavra.length - 2) + palavra[palavra.length - 1] :
                    palavra[0] + '*'.repeat(palavra.length - 1);
                    
                palavrasList += `• ${i + 1}. ${palavraCensurada}\n`;
            }

            palavrasList += `\n🛡️ *Status do anti-palavrão:* ${config.AntiSystems?.antipalavrao ? 'Ativado ✅' : 'Desativado ❌'}\n\n`;
            
            if (config.AntiSystems?.antipalavrao) {
                palavrasList += `⚠️ *Efeito ativo:* Usuários que usarem essas palavras serão removidos!\n\n👑 *Exceções:*\n• Dono do bot\n• Administradores\n• Usuários VIP\n\n`;
            }
            
            palavrasList += `💡 *Comandos úteis:*\n`;
            palavrasList += `• ${config.Prefixo}addpalavra <palavra> - Adicionar\n`;
            palavrasList += `• ${config.Prefixo}delpalavra <palavra> - Remover\n`;
            palavrasList += `• ${config.Prefixo}antipalavrao 1/0 - Ativar/Desativar\n\n`;
            palavrasList += `🔍 *Consultado por:* ${authorName}\n`;
            palavrasList += `⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

            await message.reply(palavrasList);
            
            console.log(`🔍 Lista de palavras proibidas consultada por ${authorName} no grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao listar palavras proibidas:', error);
            await message.reply('❌ Erro interno ao listar palavras! Tente novamente mais tarde.');
        }
    }
};
