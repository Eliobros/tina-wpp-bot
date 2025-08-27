// commands/membros/ping.js
const os = require('os');

module.exports = {
    name: 'ping',
    description: 'Mostra informações detalhadas do sistema e latência',
    usage: 'ping',
    execute: async ({ message, client, config }) => {
        const start = Date.now();
        
        // Calcula uptime do bot
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeFormatted = `${hours.toString().padStart(2, '0')} horas, ${minutes.toString().padStart(2, '0')} minutos e ${seconds.toString().padStart(2, '0')} segundos`;
        
        // Informações do sistema
        const platform = os.platform();
        let systemName = '';
        switch (platform) {
            case 'linux':
                systemName = 'Linux';
                break;
            case 'win32':
                systemName = 'Windows';
                break;
            case 'darwin':
                systemName = 'macOS';
                break;
            default:
                systemName = platform;
        }
        
        const release = os.release();
        
        // Memória RAM
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const totalGB = (totalMemory / (1024 ** 3)).toFixed(2);
        const freeGB = (freeMemory / (1024 ** 3)).toFixed(2);
        
        // Envia resposta temporária para calcular latência
        const tempMessage = await message.reply('🏓 Calculando...');
        const latency = Date.now() - start;
        const latencySeconds = (latency / 1000).toFixed(3);
        
        // Monta a resposta final
        const response = `⏱️ *Velocidade de Resposta:* ${latencySeconds} _segundos._
🤖 *O bot se encontra online por:* ${uptimeFormatted}.
💻 *Sistema Operacional:* ${systemName}
📂 *Versão:* ${release}
💾 *Memoria RAM total:* ${totalGB}GB
💾 *Memoria RAM disponível:* ${freeGB}GB`;
        
        // Atualiza a mensagem com as informações completas
        await tempMessage.edit(response);
    }
};

// =====================================

