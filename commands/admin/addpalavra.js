// commands/admin/addpalavra.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addpalavra',
    description: 'Adiciona uma palavra à lista de palavras proibidas (admin)',
    usage: 'addpalavra <palavra proibida>',
    execute: async ({ message, args, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        // Verifica se foi fornecida uma palavra
        if (args.length === 0) {
            const totalPalavras = config.PalavrasProibidas ? config.PalavrasProibidas.length : 0;
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}addpalavra <palavra>\n\n💡 *Exemplo:* ${config.Prefixo}addpalavra idiota\n\n📊 *Palavras cadastradas:* ${totalPalavras}\n🔍 *Ver lista:* ${config.Prefixo}listpalavra`);
        }

        const palavra = args.join(' ').toLowerCase().trim();

        // Validações
        if (palavra.length < 2) {
            return await message.reply('❌ A palavra deve ter pelo menos 2 caracteres!');
        }

        if (palavra.length > 50) {
            return await message.reply('❌ A palavra deve ter no máximo 50 caracteres!');
        }

        try {
            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Inicializa PalavrasProibidas se não existir
            if (!configData.PalavrasProibidas) {
                configData.PalavrasProibidas = [];
            }

            // Verifica se a palavra já existe
            if (configData.PalavrasProibidas.includes(palavra)) {
                return await message.reply(`⚠️ A palavra "${palavra}" já está na lista de palavras proibidas!`);
            }

            // Adiciona a palavra
            configData.PalavrasProibidas.push(palavra);
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            if (!config.PalavrasProibidas) config.PalavrasProibidas = [];
            config.PalavrasProibidas.push(palavra);
            
            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Mensagem de sucesso
            const response = `✅ *PALAVRA ADICIONADA COM SUCESSO!* ✅\n\n🤬 *Palavra proibida:* ${palavra}\n📊 *Total na lista:* ${config.PalavrasProibidas.length}\n📱 *Grupo:* ${chat.name}\n\n⚠️ *Efeito:* Usuários que usarem esta palavra serão removidos automaticamente (se anti-palavrão estiver ativo)\n\n👑 *Exceções:*\n• Dono do bot\n• Administradores do grupo\n• Usuários VIP\n\n🛡️ *Adicionada por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n\n💡 *Status do anti-palavrão:* ${config.AntiSystems?.antipalavrao ? 'Ativado ✅' : 'Desativado ❌'}`;
            
            await message.reply(response);
            
            console.log(`🤬 Palavra "${palavra}" adicionada por ${authorName} no grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao adicionar palavra proibida:', error);
            await message.reply('❌ Erro interno ao adicionar palavra! Verifique os logs.');
        }
    }
};
