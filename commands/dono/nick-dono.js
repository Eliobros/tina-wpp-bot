const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'nick-dono',
    description: 'Altera o nick do dono do bot (apenas dono)',
    usage: 'nick-dono <novo_nick>',
    execute: async ({ message, args, config }) => {
        // Verifica se foi fornecido um nick
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}nick-dono <novo_nick>\n\n💡 *Exemplo:* ${config.Prefixo}nick-dono Zeus Master\n\n👑 *Nick atual:* \`${config.NickDono}\``);
        }

        const novoNick = args.join(' ');

        // Validações básicas
        if (novoNick.length > 50) {
            return await message.reply('❌ O nick do dono deve ter no máximo 50 caracteres!');
        }

        if (novoNick.trim().length === 0) {
            return await message.reply('❌ O nick do dono não pode estar vazio!');
        }

        // Verifica se o nick é diferente do atual
        if (novoNick === config.NickDono) {
            return await message.reply(`⚠️ O nick do dono já é \`${config.NickDono}\`!`);
        }

        try {
            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Salva o nick antigo para mostrar na mensagem
            const nickAntigo = configData.NickDono;
            
            // Atualiza o nick
            configData.NickDono = novoNick;
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            config.NickDono = novoNick;
            
            // Mensagem de sucesso
            await message.reply(`✅ *Nick do dono alterado com sucesso!*\n\n🔄 *Antes:* \`${nickAntigo}\`\n👑 *Agora:* \`${novoNick}\`\n\n💡 *O novo nick aparecerá nas mensagens de permissão e comandos de info.*\n\n⚠️ *Nota:* A alteração é imediata, não precisa reiniciar o bot!`);
            
            console.log(`👑 Nick do dono alterado: '${nickAntigo}' → '${novoNick}'`);
            
        } catch (error) {
            console.error('❌ Erro ao alterar nick do dono:', error);
            await message.reply('❌ Erro interno ao alterar o nick do dono! Verifique os logs.');
        }
    }
};
