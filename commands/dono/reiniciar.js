// commands/dono/reiniciar.js
module.exports = {
    name: 'reiniciar',
    description: 'Reinicia o bot (apenas dono)',
    execute: async ({ message, client, config }) => {
        try {
            await message.reply(`🔄 ${config.NomeDoBot} está reiniciando...`);
            
            // Pequeno delay para garantir que a mensagem seja enviada
            setTimeout(() => {
                process.exit(0);
            }, 1000); // 1 segundo de espera
        } catch (err) {
            console.error('Erro ao tentar reiniciar o bot:', err);
            await message.reply('❌ Erro ao tentar reiniciar o bot.');
        }
    }
};
