// commands/admin/delpalavra.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'delpalavra',
    description: 'Remove uma palavra da lista de palavras proibidas (admin)',
    usage: 'delpalavra <palavra>',
    execute: async ({ message, args, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        // Verifica se foi fornecida uma palavra
        if (args.length === 0) {
            const totalPalavras = config.PalavrasProibidas ? config.PalavrasProibidas.length : 0;
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}delpalavra <palavra>\n\n💡 *Exemplo:* ${config.Prefixo}delpalavra idiota\n\n📊 *Palavras cadastradas:* ${totalPalavras}\n🔍 *Ver lista:* ${config.Prefixo}listpalavra`);
        }

        const palavra = args.join(' ').toLowerCase().trim();

        try {
            // Verifica se há palavras proibidas
            if (!config.PalavrasProibidas || config.PalavrasProibidas.length === 0) {
                return await message.reply(`⚠️ Nenhuma palavra proibida cadastrada!\n\n💡 *Para adicionar:* ${config.Prefixo}addpalavra <palavra>`);
            }

            // Verifica se a palavra existe na lista
            if (!config.PalavrasProibidas.includes(palavra)) {
                return await message.reply(`⚠️ A palavra "${palavra}" não está na lista de palavras proibidas!\n\n🔍 *Ver lista:* ${config.Prefixo}listpalavra`);
            }

            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Remove a palavra
            configData.PalavrasProibidas = configData.PalavrasProibidas.filter(p => p !== palavra);
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            config.PalavrasProibidas = config.PalavrasProibidas.filter(p => p !== palavra);
            
            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Mensagem de sucesso
            const response = `✅ *PALAVRA REMOVIDA COM SUCESSO!* ✅\n\n🗑️ *Palavra removida:* ${palavra}\n📊 *Total restante:* ${config.PalavrasProibidas.length}\n📱 *Grupo:* ${chat.name}\n\n💡 *Resultado:* Esta palavra não será mais detectada pelo sistema anti-palavrão\n\n🛡️ *Removida por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n🔍 *Ver lista atual:* ${config.Prefixo}listpalavra\n💡 *Status do anti-palavrão:* ${config.AntiSystems?.antipalavrao ? 'Ativado ✅' : 'Desativado ❌'}`;
            
            await message.reply(response);
            
            console.log(`🗑️ Palavra "${palavra}" removida por ${authorName} no grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao remover palavra proibida:', error);
            await message.reply('❌ Erro interno ao remover palavra! Verifique os logs.');
        }
    }
};
