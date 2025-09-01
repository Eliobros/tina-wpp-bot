// commands/admin/on.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'on',
    description: 'Remove o status de ausência do usuário (alias para voltei) (admin)',
    usage: 'on',
    execute: async ({ message, config, chat, userNumber, contact }) => {
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        try {
            const groupId = chat.id._serialized;
            const userKey = `${userNumber}@${groupId}`;

            // Verifica se o usuário está ausente
            if (!config.UsuariosAusentes || !config.UsuariosAusentes[userKey] || !config.UsuariosAusentes[userKey].ausente) {
                return await message.reply('⚠️ Você não estava marcado como ausente!');
            }

            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            const userName = contact.pushname || contact.name || 'Usuário';
            const dataAusencia = config.UsuariosAusentes[userKey].dataAusencia;
            const agora = Date.now();
            const tempoAusente = Math.floor((agora - dataAusencia) / (1000 * 60 * 60 * 24)); // dias

            // Remove a ausência
            delete configData.UsuariosAusentes[userKey];

            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza na memória
            delete config.UsuariosAusentes[userKey];

            // Reage com 🟢
            await message.react('🟢');

            // Resposta de boas-vindas
            const response = `🟢 *USUÁRIO ONLINE!* 🟢\n\n👤 *Usuário:* ${userName}\n📱 *Grupo:* ${chat.name}\n⏰ *Ausente por:* ${tempoAusente === 0 ? 'menos de 1 dia' : `${tempoAusente} dia(s)`}\n📅 *Online desde:* ${new Date().toLocaleString('pt-BR')}\n\n✨ Bem-vindo de volta!`;

            await message.reply(response);
            
            console.log(`🟢 Usuário ${userName} está online novamente no grupo ${chat.name}`);

        } catch (error) {
            console.error('❌ Erro ao remover ausência:', error);
            await message.reply('❌ Erro interno ao processar retorno.');
        }
    }
};
