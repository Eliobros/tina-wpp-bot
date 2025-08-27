// commands/dono/connectssh.js
const { Client: SSHClient } = require('ssh2');

module.exports = {
    name: 'connectssh',
    description: 'Testa a conexão SSH com a VPS (apenas dono)',
    usage: 'connectssh',
    execute: async ({ message, config }) => {
        try {
            // Reage com 🔧
            await message.react('🔧');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('🔧 Testando conexão SSH com a VPS...');

            // Verifica se as configurações VPS existem
            if (!config.VPS || !config.VPS.host || !config.VPS.username || !config.VPS.password) {
                await loadingMsg.edit(`❌ *CONFIGURAÇÕES VPS INCOMPLETAS* ❌\n\n⚠️ *Problema:* Credenciais da VPS não configuradas\n\n💡 *Configure no dono.json:*\n• host: IP da VPS\n• username: usuário\n• password: senha\n• port: porta (padrão: 22)\n\n📝 *Exemplo:*\n"VPS": {\n  "host": "192.168.1.100",\n  "username": "administrator",\n  "password": "suasenha",\n  "port": 22\n}`);
                return;
            }

            const vpsConfig = {
                host: config.VPS.host,
                port: config.VPS.port || 22,
                username: config.VPS.username,
                password: config.VPS.password
            };

            // Cria nova conexão SSH para teste
            const testSSH = new SSHClient();
            
            // Promise para controlar timeout
            const connectionTest = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout - Conexão demorou mais de 15 segundos'));
                }, 15000);

                testSSH.on('ready', () => {
                    clearTimeout(timeout);
                    
                    // Testa comando simples para verificar se funciona
                    testSSH.exec('echo "Conexão SSH funcionando"', (err, stream) => {
                        if (err) {
                            return reject(new Error(`Erro ao executar comando: ${err.message}`));
                        }

                        let output = '';
                        stream.on('data', (data) => {
                            output += data.toString();
                        });

                        stream.on('close', (code) => {
                            testSSH.end();
                            if (code === 0) {
                                resolve({
                                    success: true,
                                    output: output.trim(),
                                    message: 'Conexão SSH estabelecida e testada com sucesso!'
                                });
                            } else {
                                reject(new Error(`Comando falhou com código: ${code}`));
                            }
                        });
                    });
                });

                testSSH.on('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });

                // Inicia a conexão
                testSSH.connect(vpsConfig);
            });

            // Executa o teste
            const result = await connectionTest;

            // Resposta de sucesso
            const successMsg = `✅ *CONEXÃO SSH ESTABELECIDA* ✅\n\n🖥️ *Servidor:* ${vpsConfig.host}:${vpsConfig.port}\n👤 *Usuário:* ${vpsConfig.username}\n🔗 *Status:* Conectado com sucesso\n\n📋 *Teste realizado:*\n• Conexão SSH: ✅ OK\n• Execução de comando: ✅ OK\n• Resposta: "${result.output}"\n\n🎬 *Diretórios configurados:*\n• Filmes: ${config.VPS.filmesPath || 'Não configurado'}\n• Séries: ${config.VPS.seriesPath || 'Não configurado'}\n\n💡 *Próximos passos:*\n• Use /vpsstatus para verificar handler VPS\n• Use /filmesd para testar listagem\n• Use /seriesd para testar séries\n\n👑 *Testado por:* ${config.NickDono}\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

            await loadingMsg.edit(successMsg);
            
            console.log(`✅ Teste SSH realizado com sucesso: ${vpsConfig.host} por ${config.NickDono}`);

        } catch (error) {
            console.error('❌ Erro no teste SSH:', error);
            
            let errorMsg = `❌ *FALHA NA CONEXÃO SSH* ❌\n\n`;
            errorMsg += `🖥️ *Servidor:* ${config.VPS?.host || 'Não configurado'}\n`;
            errorMsg += `👤 *Usuário:* ${config.VPS?.username || 'Não configurado'}\n`;
            errorMsg += `🔗 *Status:* Falha na conexão\n\n`;
            errorMsg += `⚠️ *Erro:* ${error.message}\n\n`;
            
            // Diagnósticos específicos
            if (error.message.includes('ENOTFOUND')) {
                errorMsg += `💡 *Possível causa:* IP/hostname incorreto ou rede inacessível`;
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMsg += `💡 *Possível causa:* Porta SSH fechada ou serviço SSH parado`;
            } else if (error.message.includes('Authentication')) {
                errorMsg += `💡 *Possível causa:* Usuário ou senha incorretos`;
            } else if (error.message.includes('Timeout')) {
                errorMsg += `💡 *Possível causa:* Servidor lento ou firewall bloqueando`;
            } else {
                errorMsg += `💡 *Verifique:*\n• Credenciais no dono.json\n• VPS está online\n• Firewall/porta 22 aberta\n• Serviço SSH ativo`;
            }

            errorMsg += `\n\n🔧 *Configurações atuais:*\n`;
            errorMsg += `• Host: ${config.VPS?.host || '❌ Não definido'}\n`;
            errorMsg += `• Port: ${config.VPS?.port || 22}\n`;
            errorMsg += `• Username: ${config.VPS?.username || '❌ Não definido'}\n`;
            errorMsg += `• Password: ${config.VPS?.password ? '✅ Definida' : '❌ Não definida'}\n`;
            
            errorMsg += `\n⏰ *Testado em:* ${new Date().toLocaleString('pt-BR')}`;

            await message.reply(errorMsg);
        }
    }
};
