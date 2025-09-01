// commands/membros/npm.js
const https = require('https');

module.exports = {
    name: 'npm',
    description: 'Consulta informações de um pacote NPM',
    usage: 'npm <nome_do_pacote>',
    execute: async ({ message, args, config }) => {
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}npm <nome_do_pacote>\n\n💡 *Exemplo:* ${config.Prefixo}npm express`);
        }

        const packageName = args[0];

        try {
            await message.react('📦');
            
            const loadingMsg = await message.reply('📦 Consultando informações do pacote NPM...');

            const packageInfo = await consultarNPM(packageName);

            if (packageInfo.error) {
                await loadingMsg.edit(`❌ ${packageInfo.error}`);
                return;
            }

            const response = formatarInfoNPM(packageInfo, config);
            await loadingMsg.edit(response);

            console.log(`📦 Consulta NPM realizada: ${packageName}`);

        } catch (error) {
            console.error('❌ Erro no comando npm:', error);
            await message.reply('❌ Erro interno ao consultar pacote NPM.');
        }
    }
};

function consultarNPM(packageName) {
    return new Promise((resolve) => {
        const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    if (json.error) {
                        resolve({ error: `Pacote "${packageName}" não encontrado!` });
                    } else {
                        resolve(json);
                    }
                } catch (parseError) {
                    resolve({ error: 'Erro ao processar resposta da API NPM' });
                }
            });
            
        }).on('error', (error) => {
            resolve({ error: `Erro de conexão: ${error.message}` });
        });
    });
}

function formatarInfoNPM(data, config) {
    const name = data.name || 'N/A';
    const version = data['dist-tags']?.latest || 'N/A';
    const description = data.description || 'Sem descrição';
    const author = data.author?.name || data.maintainers?.[0]?.name || 'N/A';
    const license = data.license || 'N/A';
    const homepage = data.homepage || 'N/A';
    const repository = data.repository?.url || 'N/A';
    const keywords = data.keywords ? data.keywords.slice(0, 5).join(', ') : 'Nenhuma';
    
    // Pega informações da versão mais recente
    const latestVersion = data.versions?.[version];
    const dependencies = latestVersion?.dependencies ? Object.keys(latestVersion.dependencies).length : 0;
    
    // Data de publicação
    const publishedDate = data.time?.[version] ? 
        new Date(data.time[version]).toLocaleDateString('pt-BR') : 'N/A';

    return `📦 *INFORMAÇÕES DO PACOTE NPM* 📦

📋 *Nome:* ${name}
🏷️ *Versão:* ${version}
📝 *Descrição:* ${description}

👤 *AUTOR:*
${author}

📄 *DETALHES:*
📜 Licença: ${license}
📅 Publicado em: ${publishedDate}
🔗 Dependências: ${dependencies}

🔍 *TAGS:*
${keywords}

🌐 *LINKS:*
🏠 Homepage: ${homepage}
📁 Repositório: ${repository.replace('git+', '').replace('.git', '')}

💾 *INSTALAÇÃO:*
\`npm install ${name}\`

🤖 *Consultado por:* ${config.NomeDoBot}
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
}
