const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'nome-bot',
    description: 'Altera o nome do bot (apenas dono)',
    usage: 'nome-bot <novo_nome>',
    execute: async ({ message, args, config }) => {
        // Verifica se foi fornecido um nome
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}nome-bot <novo_nome>\n\n💡 *Exemplo:* ${config.Prefixo}nome-bot Tina Bot 2.0\n\n🤖 *Nome atual:* \`${config.NomeDoBot}\``);
        }

        const novoNome = args.join(' ');

        // Validações básicas
        if (novoNome.length > 30) {
            return await message.reply('❌ O nome do bot deve ter no máximo 30 caracteres!');
        }

        if (novoNome.trim().length === 0) {
            return await message.reply('❌ O nome do bot não pode estar vazio!');
        }

        // Verifica se o nome é diferente do atual
        if (novoNome === config.NomeDoBot) {
            return await message.reply(`⚠️ O nome do bot já é \`${config.NomeDoBot}\`!`);
        }

        try {
            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Salva o nome antigo para mostrar na mensagem
            const nomeAntigo = configData.NomeDoBot;
            
            // Atualiza o nome
            configData.NomeDoBot = novoNome;
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            config.NomeDoBot = novoNome;
            
            // Mensagem de sucesso
            await message.reply(`✅ *Nome do bot alterado com sucesso!*\n\n🔄 *Antes:* \`${nomeAntigo}\`\n🤖 *Agora:* \`${novoNome}\`\n\n💡 *O novo nome aparecerá nos comandos de info e mensagens do bot.*\n\n⚠️ *Nota:* A alteração é imediata, não precisa reiniciar o bot!`);
            
            console.log(`🤖 Nome do bot alterado: '${nomeAntigo}' → '${novoNome}'`);
            
        } catch (error) {
            console.error('❌ Erro ao alterar nome do bot:', error);
            await message.reply('❌ Erro interno ao alterar o nome do bot! Verifique os logs.');
        }
    }
};
