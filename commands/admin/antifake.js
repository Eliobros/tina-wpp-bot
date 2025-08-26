// commands/admin/antifake.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'antifake',
    description: 'Ativa/desativa o sistema anti-fake (apenas números de Moçambique) (admin)',
    usage: 'antifake 1 (ativar) ou antifake 0 (desativar)',
    execute: async ({ message, args, config, chat }) => {
        // Verifica se é grupo
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        // Verifica se foi fornecido argumento
        if (args.length === 0 || (args[0] !== '1' && args[0] !== '0')) {
            const currentStatus = config.AntiSystems?.antifake ? 'Ativado ✅' : 'Desativado ❌';
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:*\n• ${config.Prefixo}antifake 1 *(ativar)*\n• ${config.Prefixo}antifake 0 *(desativar)*\n\n💡 *Status atual:* ${currentStatus}\n\n🇲🇿 *Função:* Remove automaticamente números que NÃO sejam de Moçambique ao entrarem no grupo\n\n📱 *Números aceitos:* +258 (Moçambique)`);
        }

        const novoStatus = args[0] === '1';

        try {
            // Verifica se já está no status desejado
            if (config.AntiSystems?.antifake === novoStatus) {
                const statusText = novoStatus ? 'ativado' : 'desativado';
                return await message.reply(`⚠️ O anti-fake já está ${statusText} neste grupo!`);
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

            // Atualiza a configuração
            configData.AntiSystems.antifake = novoStatus;
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            if (!config.AntiSystems) config.AntiSystems = {};
            config.AntiSystems.antifake = novoStatus;
            
            // Pega informações de quem executou
            const author = await message.getContact();
            const authorName = author.pushname || author.name || 'Admin';
            
            // Mensagem de sucesso
            const statusText = novoStatus ? 'ativado ✅' : 'desativado ❌';
            const emoji = novoStatus ? '🇲🇿' : '🌍';
            
            const response = `${emoji} *ANTI-FAKE ${statusText.toUpperCase()}* ${emoji}\n\n📱 *Grupo:* ${chat.name}\n🛡️ *Sistema:* ${statusText}\n\n${novoStatus ? '⚠️ *Função ativa:*\n• Apenas números de Moçambique (+258) podem entrar\n• Números estrangeiros serão removidos automaticamente\n• Membros atuais NÃO são afetados\n\n🇲🇿 *Números permitidos:*\n• +258 XX XXX XXXX (Moçambique)\n\n❌ *Números bloqueados:*\n• Todos os outros países' : '🌍 *Resultado:* Números de qualquer país podem entrar no grupo'}\n\n🛡️ *Configurado por:* ${authorName}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
            
            await message.reply(response);
            
            console.log(`${emoji} Anti-fake ${statusText} por ${authorName} no grupo: ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao alterar configuração anti-fake:', error);
            await message.reply('❌ Erro interno ao alterar configuração! Verifique os logs.');
        }
    }
};
