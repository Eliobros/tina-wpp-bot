const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppConnection {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                name: "tina-bot-session"
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        this.setupEvents();
    }

    setupEvents() {
        this.client.on('qr', (qr) => {
            console.log('📱 Escaneie o QR Code abaixo:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('✅ Bot conectado com sucesso!');
            console.log(`🤖 ${this.client.info.pushname} está online!`);
        });

        this.client.on('authenticated', () => {
            console.log('🔐 Autenticação realizada com sucesso!');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('📴 Cliente desconectado:', reason);
        });
	this.client.on('group_join', async (notification) => {
  try {
    const group = await client.getChatById(notification.chatId);
    const member = await client.getContactById(notification.who);
    console.log(`👋 Membro ${member.pushname || member.id.user} entrou no grupo ${group.name}.`);
    // Enviar uma mensagem de boas-vindas para o grupo
    await group.sendMessage(`👋 Bem-vindo ${member.pushname || member.id.user}!`);
  } catch (err) {
    console.error("Erro ao processar evento join:", err);
  }
});

      this.client.on('group_leave', async (notification) => {
  try {
    const group = await client.getChatById(notification.chatId);
    const member = await client.getContactById(notification.who);
    console.log(`🚨 Membro ${member.pushname || member.id.user} saiu do grupo ${group.name}.`);
    // Enviar uma mensagem para o grupo
    await group.sendMessage(`👋 ${member.pushname || member.id.user} saiu do grupo!`);
  } catch (err) {
    console.error("Erro ao processar evento leave:", err);
  }
});
	this.client.on('call', async (call) => {
  try {
    // Verifica se é uma chamada de voz ou vídeo
    if (call.isGroup === false) {
      // Bloqueia o usuário
      await client.sendMessage(call.from, `🚫 Você não pode ligar para o bot! Você será bloqueado.`);
      await client.blockContact(call.from);
      console.log(`🚨 Usuário ${call.from} bloqueado por tentar ligar para o bot.`);
    }
  } catch (err) {
    console.error("Erro ao bloquear usuário:", err);
  }
});
    }

    async initialize() {
        try {
            await this.client.initialize();
            return this.client;
        } catch (error) {
            console.error('❌ Erro ao inicializar o cliente:', error);
            throw error;
        }
    }

    getClient() {
        return this.client;
    }
}

module.exports = WhatsAppConnection;
