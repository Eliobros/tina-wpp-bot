// commands/dono/vpsstatus.js
module.exports = {
    name: 'vpsstatus',
    description: 'Verifica o status da conexão com a VPS (apenas dono)',
    usage: 'vpsstatus',
    execute: async ({ message, config, client, vpsHandler }) => {
        try {
            // Reage com 🖥️
            await message.react('🖥️');

            let statusMsg = `🖥️ *STATUS DA VPS CINEMA* 🖥️\n\n`;

            if (!vpsHandler) {
                statusMsg += `❌ *Status:* Handler VPS não iniciado\n⚠️ *Problema:* Sistema VPS não está ativo\n\n💡 *Solução:* Reinicie o bot ou verifique as configurações`;
            } else {
                const status = vpsHandler.getVPSStatus();
                
                statusMsg += `${status.connected ? '✅' : '❌'} *Conexão:* ${status.connected ? 'Conectada' : 'Desconectada'}\n`;
                statusMsg += `🌐 *Host:* ${status.host}\n`;
                statusMsg += `👤 *Usuário:* ${status.username}\n`;
                
                if (status.connected) {
                    statusMsg += `\n🎬 *Serviços disponíveis:*\n`;
                    statusMsg += `• Filmes (/filmesd)\n`;
                    statusMsg += `• Séries (/seriesd)\n`;
                    statusMsg += `• Temporadas (/temp)\n`;
                    statusMsg += `• Episódios (/episodios)\n`;
                } else {
                    statusMsg += `\n⚠️ *Problema:* VPS não está acessível\n`;
                    statusMsg += `💡 *Possíveis causas:*\n`;
                    statusMsg += `• Credenciais incorretas\n`;
                    statusMsg += `• VPS offline\n`;
                    statusMsg += `• Problemas de rede\n`;
                    statusMsg += `• Firewall bloqueando SSH\n`;
                }
            }

            statusMsg += `\n👑 *Consultado por:* ${config.NickDono}\n`;
            statusMsg += `⏰ *Data:* ${new Date().toLocaleString('pt-BR')}\n`;
            statusMsg += `🤖 *Bot:* ${config.NomeDoBot}`;

            await message.reply(statusMsg);
            
            console.log(`🖥️ Status da VPS consultado pelo dono`);

        } catch (error) {
            console.error('❌ Erro no comando vpsstatus:', error);
            await message.reply('❌ Erro interno ao verificar status da VPS.');
        }
    }
};
