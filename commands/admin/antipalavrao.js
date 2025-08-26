// commands/admin/antipalavrao.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'antipalavrao',
    description: 'Ativa/desativa o sistema anti-palavrão do grupo (admin)',
    usage: 'antipalavrao 1 (ativar) ou antipalavrao 0 (desativar)',
    execute: async ({ message, args, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        // Verifica se foi fornecido argumento
        if (args.length === 0 || (args[0] !== '1' && args[0] !== '0')) {
            const currentStatus = config.AntiSystems?.antipalavrao ? 'Ativado ✅' : 'Desativado ❌';
            const totalPalavras = config.PalavrasProibidas ? config.PalavrasProibidas.length : 0;
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:*\n• ${config.Prefixo}antipalavrao 1 *(ativar)*\n• ${config.Prefixo}antipalavrao 0 *(desativar)*\n\n💡 *Status atual:* ${currentStatus}\n📊 *Palavras cadastradas:* ${totalPalavras}\n\n🤬 *Função:* Remove usuários que usam palavras proibidas\n\n💡 *Comandos relacionados:*\n• ${config.Prefixo}addpalavra <palavra>\n• ${config.Prefixo}listpalavra\n• ${config.Prefixo}delpalavra <palavra>`);
        }

        const novoStatus = args[0] === '1';

        try {
            // Verifica se já está no status desejado
            if (config.AntiSystems?.antipalavrao === novoStatus) {
                const statusText = novoStatus ? 'ativado' : 'desativado';
                return await message.reply(`⚠️ O anti-palavrão já está ${statusText} neste grupo!`);
            }

            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Inicializa AntiSystems se não existir
            if (!configData.AntiSystems) {
                configData.AntiSystems = {
                    antilink: false,
                    antifake: false,
                    antipalavrao: false,
                    antipv: false,
                    anticall: false
                };
            }

            // Inicializa PalavrasProibidas se não existir
            if (!configData.PalavrasProibidas) {
                configData.PalavrasProibidas = [];
            }

            // Atualiza a configuração
            configData.AntiSystems.antipalavrao = novoStatus;
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            if (!config.AntiSystems) config.AntiSystems = {};
            config.AntiSystems.antipalavrao = novoStatus;
            if (!config.PalavrasProibidas) config.PalavrasProibidas = [];
            
            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Mensagem de sucesso
            const statusText = novoStatus ? 'ativado ✅' : 'desativado ❌';
            const emoji = novoStatus ? '🤬' : '💬';
            const totalPalavras = config.PalavrasProibidas.length;
            
            const response = `${emoji} *ANTI-PALAVRÃO ${statusText.toUpperCase()}* ${emoji}\n\n📱 *Grupo:* ${chat.name}\n🛡️ *Sistema:* ${statusText}\n📊 *Palavras cadastradas:* ${totalPalavras}\n\n${novoStatus ? '⚠️ *Função ativa:*\n• Usuários que usarem palavras proibidas serão removidos\n• Sistema detecta variações e disfarces\n• Case-insensitive (não diferencia maiúscula/minúscula)\n\n👑 *Exceções:*\n• Dono do bot\n• Administradores do grupo\n• Usuários VIP' : '💬 *Resultado:* Usuários podem usar qualquer palavra'}\n\n💡 *Gerenciar palavras:*\n• ${config.Prefixo}addpalavra <palavra>\n• ${config.Prefixo}listpalavra\n• ${config.Prefixo}delpalavra <palavra>\n\n🛡️ *Configurado por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
            
            await message.reply(response);
            
            console.log(`${emoji} Anti-palavrão ${statusText} por ${authorName} no grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao alterar configuração anti-palavrão:', error);
            await message.reply('❌ Erro interno ao alterar configuração! Verifique os logs.');
        }
    }
};
