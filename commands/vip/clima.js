// commands/membros/clima.js
const https = require('https');

module.exports = {
    name: 'clima',
    description: 'Consulta informações meteorológicas de uma cidade',
    usage: 'clima <nome da cidade>',
    execute: async ({ message, args, config }) => {
        // Verifica se foi fornecida uma cidade
        if (args.length === 0) {
            return await message.reply(`❌ *Uso incorreto!*\n\n📖 *Como usar:* ${config.Prefixo}clima <nome da cidade>\n\n💡 *Exemplos:*\n• ${config.Prefixo}clima São Paulo\n• ${config.Prefixo}clima Rio de Janeiro\n• ${config.Prefixo}clima Lisboa`);
        }

        const cidade = args.join(' ');
        
        try {
            // Reage com 🌤️ na mensagem
            await message.react('🌤️');
            
            // Mensagem de loading
            const loadingMsg = await message.reply('🌍 Consultando informações meteorológicas...');
            
            // Busca informações do clima
            const climaData = await buscarClima(cidade);
            
            if (climaData.error) {
                await loadingMsg.edit(`❌ ${climaData.error}`);
                return;
            }

            // Formata a resposta
            const resposta = formatarResposta(climaData, config);
            
            await loadingMsg.edit(resposta);
            
            console.log(`🌤️ Consulta de clima realizada: ${cidade}`);
            
        } catch (error) {
            console.error('❌ Erro no comando clima:', error);
            await message.reply('❌ Erro interno ao consultar o clima. Tente novamente mais tarde.');
        }
    }
};

function buscarClima(cidade) {
    return new Promise((resolve) => {
        // Usando API gratuita do OpenWeatherMap
        // Você pode se cadastrar gratuitamente em: https://openweathermap.org/api
        // Para usar, defina a variável de ambiente: OPENWEATHER_API_KEY
        
        const apiKey = process.env.OPENWEATHER_API_KEY;
        
        if (!apiKey) {
            // Fallback: usar API alternativa sem chave (limitada)
            usarAPIAlternativa(cidade, resolve);
            return;
        }
        
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    if (json.cod === 200) {
                        resolve({
                            cidade: json.name,
                            pais: json.sys.country,
                            temperatura: Math.round(json.main.temp),
                            sensacao: Math.round(json.main.feels_like),
                            descricao: json.weather[0].description,
                            umidade: json.main.humidity,
                            pressao: json.main.pressure,
                            vento: json.wind.speed,
                            visibilidade: json.visibility / 1000,
                            nascerSol: new Date(json.sys.sunrise * 1000).toLocaleTimeString('pt-BR'),
                            porSol: new Date(json.sys.sunset * 1000).toLocaleTimeString('pt-BR'),
                            icon: getWeatherIcon(json.weather[0].main)
                        });
                    } else {
                        resolve({ error: `Cidade "${cidade}" não encontrada!` });
                    }
                } catch (parseError) {
                    resolve({ error: 'Erro ao processar dados meteorológicos.' });
                }
            });
            
        }).on('error', (error) => {
            console.error('Erro na requisição:', error);
            resolve({ error: 'Erro de conexão com o serviço meteorológico.' });
        });
    });
}

function usarAPIAlternativa(cidade, resolve) {
    // API alternativa gratuita (wttr.in)
    const url = `https://wttr.in/${encodeURIComponent(cidade)}?format=j1`;
    
    https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                
                if (json.current_condition && json.current_condition[0]) {
                    const current = json.current_condition[0];
                    const location = json.nearest_area[0];
                    
                    resolve({
                        cidade: location.areaName[0].value,
                        pais: location.country[0].value,
                        temperatura: parseInt(current.temp_C),
                        sensacao: parseInt(current.FeelsLikeC),
                        descricao: current.weatherDesc[0].value,
                        umidade: parseInt(current.humidity),
                        pressao: parseInt(current.pressure),
                        vento: parseFloat(current.windspeedKmph) / 3.6, // Converte para m/s
                        visibilidade: parseInt(current.visibility),
                        nascerSol: 'N/A',
                        porSol: 'N/A',
                        icon: getWeatherIconFromDesc(current.weatherDesc[0].value)
                    });
                } else {
                    resolve({ error: `Cidade "${cidade}" não encontrada!` });
                }
            } catch (parseError) {
                console.error('Erro ao parsear dados alternativos:', parseError);
                resolve({ error: 'Erro ao processar dados meteorológicos.' });
            }
        });
        
    }).on('error', (error) => {
        console.error('Erro na API alternativa:', error);
        resolve({ error: 'Erro de conexão com o serviço meteorológico.' });
    });
}

function getWeatherIcon(condition) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️'
    };
    
    return icons[condition] || '🌤️';
}

function getWeatherIconFromDesc(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('clear') || desc.includes('sunny')) return '☀️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('storm')) return '⛈️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('fog') || desc.includes('mist')) return '🌫️';
    
    return '🌤️';
}

function formatarResposta(data, config) {
    return `${data.icon} *INFORMAÇÕES METEOROLÓGICAS* ${data.icon}

📍 *Localização:* ${data.cidade}, ${data.pais}

🌡️ *Temperatura:* ${data.temperatura}°C
🤚 *Sensação térmica:* ${data.sensacao}°C
☁️ *Condição:* ${data.descricao}

💧 *Umidade:* ${data.umidade}%
📊 *Pressão:* ${data.pressao} hPa
💨 *Vento:* ${data.vento.toFixed(1)} m/s
👁️ *Visibilidade:* ${data.visibilidade} km

🌅 *Nascer do sol:* ${data.nascerSol}
🌇 *Pôr do sol:* ${data.porSol}

🤖 *Consultado por:* ${config.NomeDoBot}
⏰ *Data/Hora:* ${new Date().toLocaleString('pt-BR')}`;
}
