const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');

class WhatsAppConnection {
    constructor() {
        this.client = null;
        this.store = null;
    }

    async setupMongoDB() {
        try {
            const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/whatsapp-bot';
            console.log('🔗 Conectando ao MongoDB...');
            console.log('📍 URL:', mongoUrl);

            await mongoose.connect(mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            if (mongoose.connection.readyState === 1) {
                this.store = new MongoStore({ mongoose: mongoose });
                console.log('✅ MongoDB conectado e store inicializado!');
                return true;
            }
        } catch (error) {
            console.error('❌ Erro ao conectar MongoDB:', error.message);
            throw error;
        }
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

        // RemoteAuth events
        this.client.on('remote_session_saved', () => console.log('💾 Sessão salva no MongoDB'));
        this.client.on('remote_session_loaded', () => console.log('📥 Sessão carregada do MongoDB'));

        // Mensagens
        this.client.on('message_create', (message) => {
            console.log('📝 MESSAGE_CREATE:', {
                from: message.from,
                body: message.body,
                fromMe: message.fromMe
            });
        });

        console.log('✅ Todos os eventos configurados!');
    }

    async initialize() {
        try {
            console.log('🚀 Inicializando cliente WhatsApp...');

            await this.setupMongoDB();
            if (!this.store) throw new Error('❌ MongoStore não inicializado corretamente');

            this.client = new Client({
                puppeteer: { headless: true },
                authStrategy: new RemoteAuth({
                    store: this.store,
                    clientId: 'tina-bot-session',
                    backupSyncIntervalMs: 300000
                })
            });

            this.setupEvents();

            await this.client.initialize();
            console.log('✅ Cliente inicializado com sucesso!');

            // Mostrar quantidade de sessões salvas no MongoDB
            this.store.collection.find().toArray().then(docs => {
                console.log('📦 Sessões salvas no MongoDB:', docs.length);
            });

            return this.client;

        } catch (error) {
            console.error('❌ Erro ao inicializar o cliente:', error);
            throw error;
        }
    }

    getClient() {
        return this.client;
    }

    async disconnect() {
        console.log('🛑 Desconectando cliente WhatsApp...');
        if (this.client) await this.client.destroy();
        if (mongoose.connection.readyState === 1) await mongoose.disconnect();
        console.log('✅ Cliente e MongoDB desconectados');
    }
}

module.exports = WhatsAppConnection;
