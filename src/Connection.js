const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const dotenv = require('dotenv')
dotenv.config()

class WhatsAppConnection {
    constructor() {
        this.client = null;
    }

    setupEvents() {
        if (!this.client) return;

        // QR Code
        this.client.on('qr', (qr) => {
            console.log('📱 Escaneie o QR Code abaixo:');
            qrcode.generate(qr, { small: true });
        });

        // Ready
        this.client.on('ready', () => {
            console.log('✅ Bot conectado com sucesso!');
            console.log(`🤖 ${this.client.info.pushname} está online!`);
            console.log('📱 Número:', this.client.info.wid.user);
        });

        // Auth events
        this.client.on('authenticated', () => console.log('🔐 Autenticado com sucesso!'));
        this.client.on('auth_failure', (msg) => console.error('❌ Falha na autenticação:', msg));

        // Listener removido - sendo usado no index.js

        // Mensagens criadas (inclui as suas)
        this.client.on('message_create', (message) => {
            console.log('📝 MESSAGE_CREATE:', {
                from: message.from,
                body: message.body,
                fromMe: message.fromMe,
                type: message.type
            });
        });

        console.log('✅ Todos os eventos configurados!');
    }

    async initialize() {
        try {
            console.log('🚀 Inicializando cliente WhatsApp...');

            this.client = new Client({
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                },
                authStrategy: new LocalAuth({
                    clientId: 'tina-bot-session'
                })
            });

            this.setupEvents();

            await this.client.initialize();
            console.log('✅ Cliente inicializado com sucesso!');

            return this.client;

        } catch (error) {
            console.error('❌ Erro ao inicializar o cliente:', error);
            throw error;
        }
    }

    async disconnect() {
        console.log('🛑 Desconectando cliente WhatsApp...');
        if (this.client) await this.client.destroy();
        console.log('✅ Cliente desconectado');
    }
}

module.exports = WhatsAppConnection;
