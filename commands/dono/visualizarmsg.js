// commands/dono/visualizarmsg.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'visualizarmsg',
    description: 'Ativa ou desativa a visualização de mensagens (apenas dono)',
    usage: 'visualizarmsg 1 ou visualizarmsg 0',
    execute: async ({ message, args, config, client }) => {
        // Verifica se o argumento é válido
        if (args.length === 0 || (args[0] !== '1' && args[0] !== '0')) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:*\n• ${config.Prefixo}visualizarmsg 1 *(ativar)*\n• ${config.Prefixo}visualizarmsg 0 *(desativar)*\n\n💡 *Status atual:* ${config.VisualizarMsg ? 'Ativado ✅' : 'Desativado ❌'}`);
        }

        const novoStatus = args[0] === '1';
        
        // Verifica se já está no status desejado
        if (config.VisualizarMsg === novoStatus) {
            const statusText = novoStatus ? 'ativada' : 'desativada';
            return await message.reply(`⚠️ A visualização de mensagens já está ${statusText}!`);
        }

        try {
            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Atualiza a configuração
            configData.VisualizarMsg = novoStatus;
            
            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza também na memória
            config.VisualizarMsg = novoStatus;
            
            // Mensagem de sucesso
            const statusText = novoStatus ? 'ativada ✅' : 'desativada ❌';
            const emoji = novoStatus ? '👀' : '🙈';
            
            await message.reply(`✅ *Configuração alterada com sucesso!*\n\n${emoji} *Visualização de mensagens:* ${statusText}\n\n💡 *Resultado:* O bot ${novoStatus ? 'vai' : 'não vai'} mais visualizar as mensagens recebidas.`);
            
            console.log(`${emoji} Visualização de mensagens ${statusText} pelo dono`);
            
        } catch (error) {
            console.error('❌ Erro ao alterar configuração de visualização:', error);
            await message.reply('❌ Erro interno ao alterar a configuração! Verifique os logs.');
        }
    }
};
