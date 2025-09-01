// commands/membros/gituser.js
const https = require('https');

module.exports = {
    name: 'gituser',
    description: 'Consulta informações de um usuário do GitHub',
    usage: 'gituser <nome_do_usuario>',
    execute: async ({ message, args, config }) => {
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}gituser <nome_do_usuario>\n\n💡 *Exemplo:* ${config.Prefixo}gituser torvalds`);
        }

        const username = args[0];

        try {
            await message.react('👨‍💻');
            
            const loadingMsg = await message.reply('👨‍💻 Consultando informações do usuário GitHub...');

            const userInfo = await consultarGitHub(username);

            if (userInfo.error) {
                await loadingMsg.edit(`❌ ${userInfo.error}`);
                return;
            }

            const response = formatarInfoGitHub(userInfo, config);
            await loadingMsg.edit(response);

            console.log(`👨‍💻 Consulta GitHub realizada: ${username}`);

        } catch (error) {
            console.error('❌ Erro no comando gituser:', error);
            await message.reply('❌ Erro interno ao consultar usuário GitHub.');
        }
    }
};

function consultarGitHub(username) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.github.com',
            path: `/users/${encodeURIComponent(username)}`,
            method: 'GET',
            headers: {
                'User-Agent': 'WhatsApp-Bot'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    if (json.message === 'Not Found') {
                        resolve({ error: `Usuário "${username}" não encontrado no GitHub!` });
                    } else if (json.message) {
                        resolve({ error: json.message });
                    } else {
                        resolve(json);
                    }
                } catch (parseError) {
                    resolve({ error: 'Erro ao processar resposta da API GitHub' });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ error: `Erro de conexão: ${error.message}` });
        });

        req.end();
    });
}

function formatarInfoGitHub(data, config) {
    const login = data.login || 'N/A';
    const name = data.name || 'Nome não informado';
    const bio = data.bio || 'Bio não informada';
    const company = data.company || 'N/A';
    const location = data.location || 'N/A';
    const email = data.email || 'N/A';
    const blog = data.blog || 'N/A';
    const publicRepos = data.public_repos || 0;
    const followers = data.followers || 0;
    const following = data.following || 0;
    const profileUrl = data.html_url || 'N/A';
    
    // Data de criação da conta
    const createdAt = data.created_at ? 
        new Date(data.created_at).toLocaleDateString('pt-BR') : 'N/A';
    
    // Data da última atividade
    const updatedAt = data.updated_at ? 
        new Date(data.updated_at).toLocaleDateString('pt-BR') : 'N/A';

    return `👨‍💻 *INFORMAÇÕES DO USUÁRIO GITHUB* 👨‍💻

👤 *PERFIL:*
📛 Nome: ${name}
🔗 Username: @${login}
📝 Bio: ${bio}

🏢 *DETALHES:*
🏭 Empresa: ${company}
📍 Localização: ${location}
📧 Email: ${email}
🌐 Blog/Site: ${blog}

📊 *ESTATÍSTICAS:*
📁 Repositórios públicos: ${publicRepos}
👥 Seguidores: ${followers}
➡️ Seguindo: ${following}

📅 *DATAS:*
✨ Conta criada em: ${createdAt}
🔄 Última atualização: ${updatedAt}

🔗 *PERFIL:*
${profileUrl}

🤖 *Consultado por:* ${config.NomeDoBot}
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
}
