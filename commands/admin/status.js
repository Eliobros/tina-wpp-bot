// commands/admin/status.js
const { getGroupFlags } = require('../../src/GroupConfig');

module.exports = {
    name: 'status',
    description: 'Mostra os anti-sistemas ativados/desativados no grupo',
    usage: 'status',
    execute: async ({ message, config, chat }) => {
        if (!chat.isGroup) {
            return await message.reply('❌ Este comando só pode ser usado em grupos!');
        }

        const flags = getGroupFlags(chat.id._serialized);
        const effective = (name) => (flags[name] ?? (config.AntiSystems ? config.AntiSystems[name] : false)) === true;

        const lines = [
            [`antilink`, effective('antilink')],
            [`antifake`, effective('antifake')],
            [`antipalavrao`, effective('antipalavrao')],
            [`antimention`, effective('antimention')],
            [`anticall`, config.AntiSystems?.anticall === true],
            [`antipv`, config.AntiSystems?.antipv === true]
        ].map(([n, on]) => `- ${n}: ${on ? 'ativo ✅' : 'desativado ❌'}`).join('\n');

        const text = `📊 Status dos anti neste grupo\n\n${lines}\n\n💡 Use os comandos para ativar/desativar por grupo:\n• antilink 1|0\n• antifake 1|0\n• antipalavrao 1|0\n• antimention 1|0`;

        await message.reply(text);
    }
};

