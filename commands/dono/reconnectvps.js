// commands/dono/reconnectvps.js
module.exports = {
    name: 'reconnectvps',
    description: 'Reconecta o handler VPS Cinema (apenas dono)',
    usage: 'reconnectvps',
    execute: async ({ message, config, client }) => {
        try {
            // Reage com 🔄
            await message.react('🔄');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('🔄 Reconectando handler VPS Cinema...');

            // Verifica se as configurações VPS existem
            if (!config.VPS || !config.VPS.host || !config.VPS.username || !config.VPS.password) {
                await loadingMsg.edit(`❌ *CONFIGURAÇÕES VPS INCOMPLETAS* ❌\n\n⚠️ *Problema:* Credenciais da VPS não configuradas no dono.json\n\n💡 *Configure:*\n"VPS": {\n  "host": "45.61.51.94",\n  "username": "Administrator",\n  "password": "sua_senha",\n  "port": 22,\n  "filmesPath": "C:\\\\Users\\\\administrator\\\\Desktop\\\\Cinema\\\\Filmes",\n  "seriesPath": "C:\\\\Users\\\\administrator\\\\Desktop\\\\Cinema\\\\Series"\n}`);
                return;
            }

            // Se já existe handler, desconecta primeiro
            if (client.vpsHandler) {
                try {
                    client.vpsHandler.disconnect();
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguarda 2s
                } catch (e) {
                    console.log('Handler anterior já desconectado');
                }
            }

            // Cria novo handler VPS
            const VPSCinemaHandler = require('../../src/VPSCinemaHandler');
            client.vpsHandler = new VPSCinemaHandler(config);

            // Inicia conexão
            client.vpsHandler.connect();

            // Aguarda um pouco para conectar
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Verifica status
            const status = client.vpsHandler.getVPSStatus();
            
            if (status.connected) {
                await loadingMsg.edit(`✅ *HANDLER VPS RECONECTADO* ✅\n\n🖥️ *Servidor:* ${status.host}\n👤 *Usuário:* ${status.username}\n🔗 *Status:* Conectado com sucesso\n\n🎬 *Serviços disponíveis:*\n• /filmesd - Listar filmes\n• /seriesd - Listar séries\n• /temp <N> - Ver temporadas\n• /episodios <S> <T> - Ver episódios\n\n💡 *Teste agora:* ${config.Prefixo}filmesd\n\n👑 *Reconectado por:* ${config.NickDono}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`);
            } else {
                await loadingMsg.edit(`⚠️ *RECONEXÃO PARCIAL* ⚠️\n\n🔄 *Handler:* Criado com sucesso\n🔗 *Conexão SSH:* Ainda conectando...\n\n💡 *Aguarde mais alguns segundos e teste:*\n• ${config.Prefixo}vpsstatus\n• ${config.Prefixo}filmesd\n\n⏰ *Tentativa em:* ${new Date().toLocaleString('pt-BR')}`);
            }
            
            console.log(`🔄 Handler VPS reconectado pelo dono`);

        } catch (error) {
            console.error('❌ Erro ao reconectar VPS:', error);
            await message.reply(`❌ *ERRO NA RECONEXÃO* ❌\n\n⚠️ *Erro:* ${error.message}\n\n💡 *Tente:*\n• Reiniciar o bot completamente\n• Verificar configurações no dono.json\n• Usar ${config.Prefixo}connectssh para testar SSH\n\n⏰ *Erro em:* ${new Date().toLocaleString('pt-BR')}`);
        }
    }
};
