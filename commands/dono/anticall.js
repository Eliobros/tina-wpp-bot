// commands/dono/anticall.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'anticall',
    description: 'Ativa/desativa o sistema anti-call (bloqueia usuários que fazem chamadas) (apenas dono)',
    usage: 'anticall 1 (ativar) ou anticall 0 (desativar)',
    execute: async ({ message, args, config }) => {
        // Verifica se foi fornecido argumento
        if (args.length === 0 || (args[0] !== '1' && args[0] !== '0')) {
            const currentStatus = config.AntiSystems?.anticall ? 'Ativado ✅' : 'Desativado ❌';
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:*\n• ${config.Prefixo}anticall 1 *(ativar)*\n• ${config.Prefixo}anticall 0 *(desativar)*\n\n💡 *Status atual:* ${currentStatus}\n\n📞 *Função:* Bloqueia automaticamente usuários que fizerem chamadas (voz ou vídeo)\n\n⚠️ *Exceção:* O dono nunca será bloqueado`);
        }

        const novoStatus = args[0] === '1';

        try {
            // Verifica se já está no status desejado
            if (config.AntiSystems?.anticall === novoStatus) {
                const statusText = novoStatus ? 'ativado' : 'desativado';
                return await message.reply(`⚠️ O anti-call já está ${statusText}!`);
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
            configData.AntiSystems.anticall = novoStatus;
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            if (!config.AntiSystems) config.AntiSystems = {};
            config.AntiSystems.anticall = novoStatus;
            
            // Mensagem de sucesso
            const statusText = novoStatus ? 'ativado ✅' : 'desativado ❌';
            const emoji = novoStatus ? '📞' : '☎️';
            
            const response = `${emoji} *ANTI-CALL ${statusText.toUpperCase()}* ${emoji}\n\n🛡️ *Sistema:* ${statusText}\n👑 *Configurado por:* ${config.NickDono} (Dono)\n\n${novoStatus ? '⚠️ *Função ativa:*\n• Usuários que fizerem chamadas serão bloqueados automaticamente\n• Funciona para chamadas de voz e vídeo\n• Mensagem de aviso será enviada antes do bloqueio\n• Proteção contra chamadas indesejadas\n\n👑 *Exceção:*\n• O dono nunca será bloqueado\n\n🤖 *Resultado:* Privacidade protegida contra chamadas!' : '☎️ *Resultado:* Usuários podem fazer chamadas livremente'}\n\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
            
            await message.reply(response);
            
            console.log(`${emoji} Anti-call ${statusText} pelo dono`);

        } catch (error) {
            console.error('❌ Erro ao alterar configuração anti-call:', error);
            await message.reply('❌ Erro interno ao alterar configuração! Verifique os logs.');
        }
    }
};
