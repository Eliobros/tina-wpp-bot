const fs = require('fs');
const path = require('path');
const WhatsAppConnection = require('./src/Connection');
const ButtonHandler = require('./src/ButtonHandler');
const JoinAuthHandler = require('./src/JoinAuthHandler');
const AntiSystemsHandler = require('./src/AntiSystemsHandler');
const VPSCinemaHandler = require('./src/VPSCinemaHandler');

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
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'dono', 'dono.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
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
        const content = message.body;
        const prefix = this.config.Prefixo;

        // Verifica se a mensagem é do próprio bot (para permitir auto-resposta)
        if (message.fromMe && !content.startsWith(prefix)) return;

        // Verifica se o usuário digitou a palavra "Prefixo"
        if (content.toLowerCase() === 'prefixo') {
            const contact = await message.getContact();
            const pushName = contact.pushname || contact.name || 'Usuário';
            await message.reply(`Olá ${pushName} aqui está o prefixo do bot [${prefix}]`);
            return;
        }

        // Verifica se a mensagem começa com o prefixo
        if (!content.startsWith(prefix)) return;

        // Extrai o comando e argumentos
        const args = content.slice(prefix.length).trim().split(' ');
        const commandName = args.shift().toLowerCase();

        // Busca o comando
        const command = this.commands.get(commandName);
        if (!command) {
            // Reage com ❌ e responde que o comando não existe
            await message.react('❌');
            const contact = await message.getContact();
            const userName = contact.pushname || contact.name || 'Usuário';
            await message.reply(`Olá ${userName} esse comando não existe`);
            return;
        }

        // Verifica permissões
        const contact = await message.getContact();
        const userNumber = contact.number;
        const chat = await message.getChat();
        
        if (!await this.hasPermission(command.category, userNumber, message)) {
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
                    errorMessage = `❌ Esse comando é exclusivo para usuários VIP!\n\n⭐ Para se tornar VIP, entre em contato com:\n👑 ${this.config.NickDono}\n📱 ${this.config.NumeroDono}`;
                    break;
                default:
                    errorMessage = '❌ Você não tem permissão para usar este comando!';
            }
            
            await message.reply(errorMessage);
            return;
        }

        // Para comandos admin em grupos, verifica se o bot é admin
        if (command.category === 'admin' && chat.isGroup) {
            if (!await this.isBotAdmin(chat)) {
                await message.reply('❌ O bot precisa ser administrador para executar comandos administrativos!\n\n🔧 Peça para um admin do grupo promover o bot a administrador.');
                return;
            }
        }

        try {
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
        } catch (error) {
            console.error(`❌ Erro ao executar comando '${commandName}':`, error);
            await message.reply('❌ Ocorreu um erro ao executar este comando!');
        }
    }

    async hasPermission(category, userNumber, message) {
        const donoBr = this.config.NumeroDono;
        const chat = await message.getChat();
        
        switch (category) {
            case 'dono':
                return userNumber === donoBr;
            case 'admin':
                // Verifica se é dono primeiro
                if (userNumber === donoBr) return true;
                
                // Se não for grupo, só dono pode usar comandos admin
                if (!chat.isGroup) return false;
                
                // Verifica se é admin do grupo
                const participant = chat.participants.find(p => p.id._serialized.includes(userNumber));
                return participant && participant.isAdmin;
            case 'vip':
                // Verifica se é dono primeiro
                if (userNumber === donoBr) return true;
                
                // Verifica se é VIP
                return this.config.Vips && this.config.Vips.includes(userNumber);
            case 'membros':
                return true; // Todos podem usar
            default:
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
        this.client = await this.connection.initialize();

        // Configura o handler de mensagens
        this.client.on('message', async (message) => {
            await this.handleMessage(message);
        });

        // Configura o handler de botões
        this.buttonHandler = new ButtonHandler(this.client, this.config);

        // Configura o handler de autorização de grupos
        this.joinAuthHandler = new JoinAuthHandler(this.client, this.config);

        console.log('🎉 Tina Bot está rodando!');

        // --- Inicializa o handler da VPS ---
        // Pega as configs corretas dentro de dono.json
        this.vpsHandler = new VPSCinemaHandler({
            host: this.config.VPS.host,
            port: this.config.VPS.port,
            username: this.config.VPS.username,
            password: this.config.VPS.password,
            filmesPath: this.config.VPS.filmesPath,
            seriesPath: this.config.VPS.seriesPath
        });
        try {
            await this.vpsHandler.start(); // inicia conexão SSH e prepara comandos
            console.log("🖥️ Handler VPS conectado com sucesso!");
        } catch (err) {
            console.error("❌ Falha ao conectar o Handler VPS:", err.message);
        }

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
