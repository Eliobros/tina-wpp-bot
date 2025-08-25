// commands/dono/reiniciar.js
module.exports = {
    name: 'reiniciar',
    description: 'Reinicia o bot (apenas dono)',
    execute: async ({ message, client, config }) => {
        await message.reply(`🔄 ${config.NomeDoBot} será reiniciado pelo dono ${config.NickDono}!`);
        process.exit(0);
    }
};
