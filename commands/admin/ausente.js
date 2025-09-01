// commands/admin/ausente.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ausente',
    description: 'Marca o usuário como ausente (admin)',
    usage: 'ausente <motivo da ausência>',
    execute: async ({ message, args, config, chat, userNumber, contact }) => {
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}ausente <motivo>\n\n💡 *Exemplo:* ${config.Prefixo}ausente Viajando por alguns dias`);
        }

        const motivo = args.join(' ');

        try {
            // Caminho do arquivo de configuração
            const configPath = path.join(__dirname, '..', '..', 'dono', 'dono.json');
            
            // Lê o arquivo atual
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Inicializa UsuariosAusentes se não existir
            if (!configData.UsuariosAusentes) {
                configData.UsuariosAusentes = {};
            }

            const userName = contact.pushname || contact.name || 'Usuário';
            const groupId = chat.id._serialized;
            const userKey = `${userNumber}@${groupId}`;

            // Marca como ausente
            configData.UsuariosAusentes[userKey] = {
                userNumber,
                userName,
                groupId,
                groupName: chat.name,
                motivo,
                ausente: true,
                dataAusencia: Date.now()
            };

            // Salva no arquivo
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            
            // Atualiza na memória
            if (!config.UsuariosAusentes) config.UsuariosAusentes = {};
            config.UsuariosAusentes[userKey] = configData.UsuariosAusentes[userKey];

            // Reage com ✈️
            await message.react('✈️');

            // Resposta de confirmação
            const response = `✈️ *AUSÊNCIA REGISTRADA* ✈️\n\n👤 *Usuário:* ${userName}\n📱 *Grupo:* ${chat.name}\n📝 *Motivo:* ${motivo}\n📅 *Desde:* ${new Date().toLocaleString('pt-BR')}\n\n💡 *Info:* Quando alguém mencionar você, será exibida sua ausência automaticamente.\n\n🔄 *Para voltar:* Use ${config.Prefixo}voltei ou ${config.Prefixo}on`;

            await message.reply(response);
            
            console.log(`✈️ Usuário ${userName} marcado como ausente no grupo ${chat.name} - Motivo: ${motivo}`);

        } catch (error) {
            console.error('❌ Erro ao marcar ausência:', error);
            await message.reply('❌ Erro interno ao registrar ausência.');
        }
    }
};
