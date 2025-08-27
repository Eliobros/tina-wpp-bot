const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'setprefix',
    description: 'Altera o prefixo do bot (apenas dono)',
    usage: 'setprefix <novo_prefixo>',
    execute: async ({ message, args, config }) => {
        // Verifica se foi fornecido um prefixo
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}setprefix <novo_prefixo>\n\n💡 *Exemplo:* ${config.Prefixo}setprefix !\n\n📋 *Prefixo atual:* \`${config.Prefixo}\``);
        }

        const novoPrefixo = args[0];

        // Validações básicas
        if (novoPrefixo.length > 3) {
            return await message.reply('❌ O prefixo deve ter no máximo 3 caracteres!');
        }

        if (novoPrefixo.includes(' ')) {
            return await message.reply('❌ O prefixo não pode conter espaços!');
        }

        // Verifica se o prefixo é diferente do atual
        if (novoPrefixo === config.Prefixo) {
            return await message.reply(`⚠️ O prefixo já é \`${config.Prefixo}\`!`);
        }

        try {
            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Salva o prefixo antigo para mostrar na mensagem
            const prefixoAntigo = configData.Prefixo;
            
            // Atualiza o prefixo
            configData.Prefixo = novoPrefixo;
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            config.Prefixo = novoPrefixo;
            
            // Mensagem de sucesso
            await message.reply(`✅ *Prefixo alterado com sucesso!*\n\n🔄 *Antes:* \`${prefixoAntigo}\`\n✨ *Agora:* \`${novoPrefixo}\`\n\n💡 *Exemplo de uso:* ${novoPrefixo}ping\n\n⚠️ *Nota:* A alteração é imediata, não precisa reiniciar o bot!`);
            
            console.log(`🔄 Prefixo alterado pelo dono: '${prefixoAntigo}' → '${novoPrefixo}'`);
            
        } catch (error) {
            console.error('❌ Erro ao alterar prefixo:', error);
            await message.reply('❌ Erro interno ao alterar o prefixo! Verifique os logs.');
        }
    }
};
