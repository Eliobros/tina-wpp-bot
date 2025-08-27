// commands/membros/menu.js
module.exports = {
    name: 'menu',
    description: 'Exibe todos os comandos disponíveis organizados por categoria',
    usage: 'menu',
    execute: async ({ message, config, client, chat }) => {
        try {
            // Informações do usuário
            const contact = await message.getContact();
            const pushname = contact.pushname || contact.name || 'Usuário';
            const userNumber = contact.number;
            
            // Informações do chat
            const isGroup = chat.isGroup;
            const groupName = isGroup ? chat.name : 'N/A';
            const isPrivate = !isGroup;
            
            // Data e hora atual
            const now = new Date();
            const date = now.toLocaleDateString('pt-BR');
            const time = now.toLocaleTimeString('pt-BR');
            
            // Carrega todos os comandos disponíveis
            const fs = require('fs');
            const path = require('path');
            
            const commandsPath = path.join(__dirname, '..', '..');
            const categories = {
                'dono': [],
                'admin': [],
                'membros': [],
		'vip': []
            };
            
            // Coleta comandos por categoria
            ['dono', 'admin', 'membros', 'vip'].forEach(category => {
                const categoryPath = path.join(commandsPath, 'commands', category);
                
                if (fs.existsSync(categoryPath)) {
                    const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
                    
                    files.forEach(file => {
                        try {
                            const filePath = path.join(categoryPath, file);
                            const command = require(filePath);
                            if (command.name) {
                                categories[category].push({
                                    name: command.name,
                                    description: command.description || 'Sem descrição'
                                });
                            }
                        } catch (error) {
                            console.error(`Erro ao carregar comando ${file}:`, error);
                        }
                    });
                }
            });
            
            // Verifica permissões do usuário
            const isDono = userNumber === config.NumeroDono;
            let isAdmin = isDono;
            const isVip = config.Vips && config.Vips.includes(userNumber);
            if (isGroup && !isDono) {
                const participant = chat.participants.find(p => p.id._serialized.includes(userNumber));
                isAdmin = participant && participant.isAdmin;
            }
            
            // Monta o menu
            let menu = `┏╼࡙ᷓ✿࡙╾ᷓ╼֡͜💙⃘໋ᩚ᳕֓╾╼࡙ᷓ✿࡙╾ᷓ┓\n`;
            menu += `な ⃟̸̷᪺͓͡👤 Usuário: @${pushname}\n`;
            menu += `Grupo?: ${isGroup ? 'sim' : 'não'}\n`;
            menu += `Nome do grupo: ${groupName}\n`;
            menu += `Privado: ${isPrivate ? 'sim' : 'não'}\n`;
            menu += `Data: ${date}\n`;
            menu += `Hora: ${time}\n\n`;
            menu += `[ *Aqui está o seu Menu* ]\n`;
            menu += `┗┮✿࡙╾ᷓ╼֡͜💙⃘໋ᩚ᳕֓╾╼࡙ᷓ✿࡙╼┛\n\n`;
            
            // Menu Principal (todos podem ver)
            if (categories.membros.length > 0) {
                menu += `╭╌❅̸╌═⊱≈『💙 MENU PRINCIPAL 💙』≈⊰═╌❅̸╌╮\n`;
                menu += `   ╭╌❅̸╌═⊱≈\n`;
                categories.membros.forEach(cmd => {
                    menu += `╎║💙ꪾ〬ꩌ۪${config.Prefixo}${cmd.name}\n`;
                });
                menu += `   ╰╌❅̸╌═⊱≈\n`;
                menu += `╰╌❅̸╌═⊱≈『💙 MENU PRINCIPAL 💙』≈⊰═╌❅̸╌╯\n\n`;
            }
            
            // Menu Admin (só para admins e dono)
            if (isAdmin && categories.admin.length > 0) {
                menu += `╭╌❅̸╌═⊱≈『🛡️ MENU ADMIN 🛡️』≈⊰═╌❅̸╌╮\n`;
                menu += `   ╭╌❅̸╌═⊱≈\n`;
                categories.admin.forEach(cmd => {
                    menu += `╎║🛡️ꪾ〬ꩌ۪${config.Prefixo}${cmd.name}\n`;
                });
                menu += `   ╰╌❅̸╌═⊱≈\n`;
                menu += `╰╌❅̸╌═⊱≈『🛡️ MENU ADMIN 🛡️』≈⊰═╌❅̸╌╯\n\n`;
            }
            
            // Menu Dono (só para o dono)
            if (isDono && categories.dono.length > 0) {
                menu += `╭╌❅̸╌═⊱≈『👑 MENU DONO 👑』≈⊰═╌❅̸╌╮\n`;
                menu += `   ╭╌❅̸╌═⊱≈\n`;
                categories.dono.forEach(cmd => {
                    menu += `╎║👑ꪾ〬ꩌ۪${config.Prefixo}${cmd.name}\n`;
                });
                menu += `   ╰╌❅̸╌═⊱≈\n`;
                menu += `╰╌❅̸╌═⊱≈『👑 MENU DONO 👑』≈⊰═╌❅̸╌╯\n\n`;
            }

	    // Menu VIP (só para usuarios vips)
            if (isVip && categories.vip.length > 0) {
                menu += `╭╌❅̸╌═⊱≈『👑 MENU VIP 👑』≈⊰═╌❅̸╌╮\n`;
                menu += `   ╭╌❅̸╌═⊱≈\n`;
                categories.vip.forEach(cmd => {
                    menu += `╎║👑ꪾ〬ꩌ۪${config.Prefixo}${cmd.name}\n`;
                });
                menu += `   ╰╌❅̸╌═⊱≈\n`;
                menu += `╰╌❅̸╌═⊱≈『👑 MENU VIP 👑』≈⊰═╌❅̸╌╯\n\n`;
            }
            
            // Rodapé
            menu += `📱 *Bot:* ${config.NomeDoBot}\n`;
            menu += `👑 *Dono:* ${config.NickDono}\n`;
            menu += `⚡ *Prefixo:* ${config.Prefixo}\n`;
            menu += `📊 *Total de comandos:* ${categories.membros.length + (isAdmin ? categories.admin.length : 0) + (isDono ? categories.dono.length : 0)}`;
            
            // Envia o menu mencionando o usuário
            await message.reply(menu, null, { mentions: [contact.id._serialized] });
            
        } catch (error) {
            console.error('❌ Erro ao gerar menu:', error);
            await message.reply('❌ Erro ao gerar o menu. Tente novamente mais tarde.');
        }
    }
};
