const fs = require('fs');
const path = require('path');
const WhatsAppConnection = require('./src/Connection');
const ButtonHandler = require('./src/ButtonHandler');
const JoinAuthHandler = require('./src/JoinAuthHandler');
const AntiSystemsHandler = require('./src/AntiSystemsHandler');
const VPSCinemaHandler = require('./src/VPSCinemaHandler');
const AbsenceHandler = require('./src/AbsenceHandler');

class TinaBot {
    constructor() {
        this.commands = new Map();
        this.config = this.loadConfig();
        this.connection = new WhatsAppConnection();
        this.client = null;
        this.buttonHandler = null;
        this.joinAuthHandler = null;
        this.antiSystemsHandler = null;
        this.vpsHandler = null;
        this.absenceHandler = null;
        this.messageCount = 0; // Contador para debug
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'dono', 'dono.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            console.log('✅ Configurações carregadas:', {
                nome: config.NomeDoBot,
                prefixo: config.Prefixo,
                dono: config.NickDono
            });
            return config;
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
            process.exit(1);
        }
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const categories = ['dono', 'admin', 'vip', 'membros'];

        categories.forEach(category => {
            const categoryPath = path.join(commandsPath, category);

            if (fs.existsSync(categoryPath)) {
                const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

                files.forEach(file => {
                    try {
                        const filePath = path.join(categoryPath, file);
                        delete require.cache[require.resolve(filePath)];
                        const command = require(filePath);

                        if (command.name && command.execute) {
                            command.category = category;
                            this.commands.set(command.name, command);
                            console.log(`✅ Comando '${command.name}' carregado da categoria '${category}'`);
                        } else {
                            console.log(`⚠️  Comando '${file}' não possui estrutura válida`);
                        }
                    } catch (error) {
                        console.error(`❌ Erro ao carregar comando ${file}:`, error);
                    }
                });
            }
        });

        console.log(`📋 Total de comandos carregados: ${this.commands.size}`);
    }

    async handleMessage(message) {
        this.messageCount++;
        console.log(`\n🔥 HANDLE MESSAGE CHAMADO! (${this.messageCount})`);
        console.log('📨 Dados da mensagem:', {
            body: message.body,
            from: message.from,
            fromMe: message.fromMe,
            type: message.type,
            hasQuotedMsg: message.hasQuotedMsg,
            timestamp: new Date(message.timestamp * 1000).toLocaleString()
        });

        const content = message.body;
        const prefix = this.config.Prefixo;

        console.log(`🔍 Verificando prefixo: "${prefix}"`);
        console.log(`📝 Conteúdo da mensagem: "${content}"`);

        // Verifica se a mensagem é do próprio bot (para permitir auto-resposta)
        if (message.fromMe && !content.startsWith(prefix)) {
            console.log('↩️ Mensagem própria ignorada');
            return;
        }

        // Verifica se o usuário digitou a palavra "Prefixo"
        if (content.toLowerCase() === 'prefixo') {
            console.log('ℹ️ Comando "prefixo" detectado');
            const contact = await message.getContact();
            const pushName = contact.pushname || contact.name || 'Usuário';
            await message.reply(`Olá ${pushName} aqui está o prefixo do bot [${prefix}]`);
            return;
        }

        // COMANDO PING SIMPLES PARA TESTE
        if (content.toLowerCase() === 'ping') {
            console.log('🏓 Comando ping simples detectado');
            try {
                await message.reply('Pong! 🏓 Bot funcionando!');
                console.log('✅ Resposta ping enviada');
            } catch (error) {
                console.error('❌ Erro ao enviar ping:', error);
            }
            return;
        }

        // Verifica se a mensagem começa com o prefixo
        if (!content.startsWith(prefix)) {
            console.log(`❌ Mensagem não começa com prefixo "${prefix}"`);
            return;
        }

        console.log('✅ Mensagem começa com prefixo!');

        // Extrai o comando e argumentos
        const args = content.slice(prefix.length).trim().split(' ');
        const commandName = args.shift().toLowerCase();

        console.log(`🎯 Comando extraído: "${commandName}"`);
        console.log(`📋 Argumentos:`, args);

        // Busca o comando
        const command = this.commands.get(commandName);
        if (!command) {
            console.log(`❌ Comando "${commandName}" não encontrado`);
            // Reage com ❌ e responde que o comando não existe
            await message.react('❌');
            const contact = await message.getContact();
            const userName = contact.pushname || contact.name || 'Usuário';
            await message.reply(`Olá ${userName} esse comando não existe`);
            return;
        }

        console.log(`✅ Comando "${commandName}" encontrado! Categoria: ${command.category}`);

        // Verifica permissões
        const contact = await message.getContact();
        const userNumber = contact.number;
        const chat = await message.getChat();

        console.log(`👤 Usuário: ${userNumber}`);
        console.log(`💬 Chat: ${chat.isGroup ? 'Grupo' : 'Privado'}`);

        if (!await this.hasPermission(command.category, userNumber, message)) {
            console.log(`🚫 Usuário sem permissão para categoria "${command.category}"`);
            
            let errorMessage = '';

            switch (command.category) {
                case 'dono':
                    errorMessage = `❌ Esse comando só pode ser executado pelo Meu Dono!\n\n👑 Dono: ${this.config.NickDono}`;
                    break;
                case 'admin':
                    if (chat.isGroup) {
                        errorMessage = '❌ Esse comando só pode ser executado por Admins do grupo!';
                    } else {
                        errorMessage = `❌ Esse comando só pode ser executado pelo Meu Dono!\n\n👑 Dono: ${this.config.NickDono}`;
                    }
                    break;
                case 'vip':
                    errorMessage = `❌ Esse comando é exclusivo para usuários VIP!\n\n⭐ Para se tornar VIP, entre em contato com:\n👑 ${this.config.NickDono}`;
                    break;
                default:
                    errorMessage = '❌ Você não tem permissão para usar este comando!';
            }

            await message.reply(errorMessage);
            return;
        }

        console.log(`✅ Permissão concedida para "${command.category}"`);

        // Para comandos admin em grupos, verifica se o bot é admin
        if (command.category === 'admin' && chat.isGroup) {
            if (!await this.isBotAdmin(chat)) {
                console.log('🤖 Bot não é admin do grupo');
                await message.reply('❌ O bot precisa ser administrador para executar comandos administrativos!\n\n🔧 Peça para um admin do grupo promover o bot.');
                return;
            }
        }

        try {
            console.log(`🚀 Executando comando "${commandName}"...`);
            // Executa o comando passando as configurações
            await command.execute({
                message,
                args,
                client: this.client,
                config: this.config,
                userNumber,
                contact,
                chat
            });
            console.log(`✅ Comando "${commandName}" executado com sucesso!`);
        } catch (error) {
            console.error(`❌ Erro ao executar comando '${commandName}':`, error);
            await message.reply('❌ Ocorreu um erro ao executar este comando!');
        }
    }

    async hasPermission(category, userNumber, message) {
        const donoBr = this.config.NumeroDono;
        const chat = await message.getChat();

        console.log(`🔐 Verificando permissão - Categoria: ${category}, Usuário: ${userNumber}, Dono: ${donoBr}`);

        switch (category) {
            case 'dono':
                const isDono = userNumber === donoBr;
                console.log(`👑 É dono? ${isDono}`);
                return isDono;
            case 'admin':
                // Verifica se é dono primeiro
                if (userNumber === donoBr) {
                    console.log('👑 Dono tem permissão admin');
                    return true;
                }

                // Se não for grupo, só dono pode usar comandos admin
                if (!chat.isGroup) {
                    console.log('💬 Chat privado - só dono pode usar admin');
                    return false;
                }

                // Verifica se é admin do grupo
                const participant = chat.participants.find(p => p.id._serialized.includes(userNumber));
                const isAdmin = participant && participant.isAdmin;
                console.log(`👮 É admin do grupo? ${isAdmin}`);
                return isAdmin;
            case 'vip':
                // Verifica se é dono primeiro
                if (userNumber === donoBr) {
                    console.log('👑 Dono tem permissão VIP');
                    return true;
                }

                // Verifica se é VIP
                const isVip = this.config.Vips && this.config.Vips.includes(userNumber);
                console.log(`⭐ É VIP? ${isVip}`);
                return isVip;
            case 'membros':
                console.log('👥 Todos podem usar comandos de membros');
                return true; // Todos podem usar
            default:
                console.log('❓ Categoria desconhecida');
                return false;
        }
    }

    async isBotAdmin(chat) {
        if (!chat.isGroup) return true; // Em chat privado, não precisa ser admin

        const botNumber = this.client.info.wid._serialized;
        const botParticipant = chat.participants.find(p => p.id._serialized === botNumber);

        return botParticipant && botParticipant.isAdmin;
    }

    async start() {
        try {
            console.log('🚀 Iniciando Tina Bot...');
            console.log(`🤖 Nome: ${this.config.NomeDoBot}`);
            console.log(`👑 Dono: ${this.config.NickDono}`);
            console.log(`📞 Número do Dono: ${this.config.NumeroDono}`);
            console.log(`⚡ Prefixo: ${this.config.Prefixo}`);

            // Carrega os comandos
            this.loadCommands();

            // Inicializa a conexão
            console.log('🔄 Inicializando conexão WhatsApp...');
            this.client = await this.connection.initialize();
            console.log('✅ Cliente WhatsApp obtido!');

            // IMPORTANTE: Configura o handler de mensagens
            console.log('📡 Configurando listener de mensagens...');
            this.client.on('message', async (message) => {
                console.log('\n🎯 ===== EVENT MESSAGE DISPARADO NO INDEX! =====');
                console.log('📨 Mensagem:', message.body);
                console.log('👤 De:', message.from);
                console.log('🤖 É minha:', message.fromMe);
                console.log('📱 Tipo:', message.type);
                
                try {
                    await this.handleMessage(message);
                } catch (error) {
                    console.error('❌ Erro no handleMessage:', error);
                }
                console.log('===== FIM DO PROCESSAMENTO =====\n');
            });

            // Configura outros handlers
            this.buttonHandler = new ButtonHandler(this.client, this.config);
            this.joinAuthHandler = new JoinAuthHandler(this.client, this.config);

            console.log('🎉 Tina Bot está rodando!');
            console.log('💡 Para testar, digite "ping" (sem prefixo) ou "prefixo" para ver o prefixo');

        } catch (error) {
            console.error('❌ Erro ao iniciar o bot:', error);
        }
    }
}

// Inicia o bot
const bot = new TinaBot();
bot.start();

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Encerrando bot...');

    try {
        if (bot.connection) {
            await bot.connection.disconnect();
        }
        console.log('✅ Bot encerrado com sucesso');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao encerrar:', error);
        process.exit(1);
    }
});
