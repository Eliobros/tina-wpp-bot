// commands/membros/ip.js
const https = require('https');

module.exports = {
    name: 'ip',
    description: 'Consulta informações de um IP usando ipinfo.io',
    usage: 'ip [endereço_ip]',
    execute: async ({ message, args, config }) => {
        try {
            await message.react('🌐');
            
            let targetIP = '';
            
            // Se não forneceu IP, usa o IP público do servidor
            if (args.length === 0) {
                targetIP = ''; // Deixa vazio para usar próprio IP
            } else {
                targetIP = args[0];
                
                // Validação básica de IP
                const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
                if (!ipRegex.test(targetIP)) {
                    return await message.reply(`❌ *IP inválido!*\n\n📖 *Formato correto:* 192.168.1.1\n💡 *Exemplo:* ${config.Prefixo}ip 8.8.8.8`);
                }
            }

            const loadingMsg = await message.reply('🌐 Consultando informações do IP...');

            const ipInfo = await consultarIP(targetIP);

            if (ipInfo.error) {
                await loadingMsg.edit(`❌ Erro ao consultar IP: ${ipInfo.error}`);
                return;
            }

            const response = formatarInfoIP(ipInfo, targetIP, config);
            await loadingMsg.edit(response);

            console.log(`🌐 Consulta de IP realizada: ${targetIP || 'próprio IP'}`);

        } catch (error) {
            console.error('❌ Erro no comando ip:', error);
            await message.reply('❌ Erro interno ao consultar informações do IP.');
        }
    }
};

function consultarIP(ip) {
    return new Promise((resolve) => {
        const url = `https://ipinfo.io/${ip}/json`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    if (json.error) {
                        resolve({ error: json.error });
                    } else {
                        resolve(json);
                    }
                } catch (parseError) {
                    resolve({ error: 'Erro ao processar resposta da API' });
                }
            });
            
        }).on('error', (error) => {
            resolve({ error: `Erro de conexão: ${error.message}` });
        });
    });
}

function formatarInfoIP(data, targetIP, config) {
    const ip = data.ip || targetIP || 'N/A';
    const hostname = data.hostname || 'Não disponível';
    const city = data.city || 'N/A';
    const region = data.region || 'N/A';
    const country = data.country || 'N/A';
    const loc = data.loc || 'N/A';
    const org = data.org || 'N/A';
    const timezone = data.timezone || 'N/A';
    const postal = data.postal || 'N/A';

    return `🌐 *INFORMAÇÕES DO IP* 🌐

📍 *IP:* ${ip}
🖥️ *Hostname:* ${hostname}

📍 *LOCALIZAÇÃO:*
🏙️ Cidade: ${city}
🗺️ Região: ${region}
🇧🇷 País: ${country}
📊 Coordenadas: ${loc}
📮 CEP: ${postal}
🕐 Timezone: ${timezone}

🏢 *ORGANIZAÇÃO:*
${org}

${targetIP ? '' : '💡 *Observação:* Esta é a informação do seu IP público'}

🤖 *Consultado por:* ${config.NomeDoBot}
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
}
