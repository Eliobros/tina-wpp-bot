// src/ButtonHandler.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

class ButtonHandler {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.setupButtonListener();
    }

    setupButtonListener() {
        // Para wwebjs, vamos simular botões usando reações
        this.client.on('message_reaction', async (reaction) => {
            try {
                await this.handleButtonReaction(reaction);
            } catch (error) {
                console.error('❌ Erro no handler de botões:', error);
            }
        });
    }

    async handleButtonReaction(reaction) {
	const msgId = reaction.msgId._serialized;
        const message =  await this.client.getMessageById(msgId)
        const emoji = reaction.reaction;
        
        // Verifica se é uma reação em mensagem do play
        if (!message.body.includes('✰͡ൣ᭄∆🔉𝐁𝐄𝐌✰𝐕𝐈𝐍𝐃𝐎🔊∆✰͡ൣ᭄')) {
            return;
        }
        
        // Remove a reação
        await reaction.remove();
        
        // Extrai o ID do vídeo da mensagem (você pode implementar uma forma melhor)
        const videoData = this.findVideoDataFromMessage(message);
        if (!videoData) {
            await message.reply('❌ Dados do vídeo não encontrados. Faça uma nova busca.');
            return;
        }
        
        switch (emoji) {
            case '🔉':
                await this.downloadAudio(message, videoData);
                break;
            case '📽':
                await this.downloadVideo(message, videoData);
                break;
            case '❌':
                await this.cancelDownload(message, videoData);
                break;
        }
    }

    findVideoDataFromMessage(message) {
        // Implementar lógica para encontrar dados do vídeo
        // Por simplicidade, vamos usar dados globais temporários
        if (global.tempVideoData) {
            const keys = Object.keys(global.tempVideoData);
            if (keys.length > 0) {
                return global.tempVideoData[keys[keys.length - 1]]; // Pega o mais recente
            }
        }
        return null;
    }

    async downloadAudio(message, videoData) {
        try {
            const loadingMsg = await message.reply('🎵 Baixando áudio... Aguarde!');
            
            const result = await this.runPythonScript('download', videoData.url, 'audio');
            
            if (result.error) {
                await loadingMsg.edit('❌ Erro ao baixar áudio: ' + result.error);
                return;
            }
            
            // Verifica se o arquivo existe
            if (!fs.existsSync(result.filepath)) {
                await loadingMsg.edit('❌ Arquivo de áudio não encontrado após download.');
                return;
            }
            
            // Envia o áudio
            const media = MessageMedia.fromFilePath(result.filepath);
            
            const caption = `🎵 *Áudio baixado com sucesso!*\n\n📱 *Título:* ${result.title}\n🎤 *Canal:* ${videoData.uploader}\n🤖 *Bot:* ${this.config.NomeDoBot}`;
            
            await loadingMsg.edit(media, { caption });
            
            // Remove o arquivo após enviar
            setTimeout(() => {
                if (fs.existsSync(result.filepath)) {
                    fs.unlinkSync(result.filepath);
                }
            }, 30000);
            
            console.log(`🎵 Áudio baixado e enviado: ${result.title}`);
            
        } catch (error) {
            console.error('❌ Erro ao baixar áudio:', error);
            await message.reply('❌ Erro interno ao baixar áudio.');
        }
    }

    async downloadVideo(message, videoData) {
        try {
            const loadingMsg = await message.reply('📽 Baixando vídeo... Isso pode demorar!');
            
            const result = await this.runPythonScript('download', videoData.url, 'video');
            
            if (result.error) {
                await loadingMsg.edit('❌ Erro ao baixar vídeo: ' + result.error);
                return;
            }
            
            // Verifica se o arquivo existe
            if (!fs.existsSync(result.filepath)) {
                await loadingMsg.edit('❌ Arquivo de vídeo não encontrado após download.');
                return;
            }
            
            // Verifica tamanho do arquivo (WhatsApp tem limite)
            const stats = fs.statSync(result.filepath);
            const fileSizeMB = stats.size / (1024 * 1024);
            
            if (fileSizeMB > 64) { // Limite do WhatsApp
                await loadingMsg.edit(`❌ Vídeo muito grande (${fileSizeMB.toFixed(1)}MB). Limite: 64MB. Tente baixar como áudio.`);
                
                // Remove o arquivo
                if (fs.existsSync(result.filepath)) {
                    fs.unlinkSync(result.filepath);
                }
                return;
            }
            
            // Envia o vídeo
            const media = MessageMedia.fromFilePath(result.filepath);
            
            const caption = `📽 *Vídeo baixado com sucesso!*\n\n📱 *Título:* ${result.title}\n🎬 *Canal:* ${videoData.uploader}\n💾 *Tamanho:* ${fileSizeMB.toFixed(1)}MB\n🤖 *Bot:* ${this.config.NomeDoBot}`;
            
            await loadingMsg.edit(media, { caption });
            
            // Remove o arquivo após enviar
            setTimeout(() => {
                if (fs.existsSync(result.filepath)) {
                    fs.unlinkSync(result.filepath);
                }
            }, 60000);
            
            console.log(`📽 Vídeo baixado e enviado: ${result.title} (${fileSizeMB.toFixed(1)}MB)`);
            
        } catch (error) {
            console.error('❌ Erro ao baixar vídeo:', error);
            await message.reply('❌ Erro interno ao baixar vídeo.');
        }
    }

    async cancelDownload(message, videoData) {
        await message.reply('❌ Download cancelado!');
        
        // Limpa dados temporários
        if (global.tempVideoData) {
            const keys = Object.keys(global.tempVideoData);
            keys.forEach(key => {
                if (global.tempVideoData[key].url === videoData.url) {
                    delete global.tempVideoData[key];
                }
            });
        }
        
        console.log('❌ Download cancelado pelo usuário');
    }

    runPythonScript(action, ...args) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, '..', 'scripts', 'youtube_downloader.py');
            const command = `python3 "${scriptPath}" ${action} "${args.join('" "')}"`;
            
            exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Erro Python:', error);
                    resolve({ error: error.message });
                    return;
                }
                
                if (stderr) {
                    console.error('Python stderr:', stderr);
                }
                
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (parseError) {
                    console.error('Erro ao parsear JSON:', parseError);
                    resolve({ error: 'Erro ao processar resposta do Python' });
                }
            });
        });
    }
}

module.exports = ButtonHandler;
