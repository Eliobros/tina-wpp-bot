// src/VPSCinemaHandler.js
const { Client: SSHClient } = require('ssh2');

class VPSCinemaHandler {
    constructor(config) {
        this.config = config;
        this.ssh = new SSHClient();
        this.isConnected = false;
        this.seriesLists = new Map(); // Armazena listas por usuário
        this.setupSSH();
    }

    setupSSH() {
        // Configuração da VPS (recebe diretamente as configs)
        this.vpsConfig = {
            host: this.config.host || process.env.VPS_HOST,
            port: this.config.port || 22,
            username: this.config.username || process.env.VPS_USERNAME,
            password: this.config.password || process.env.VPS_PASSWORD
        };

        // Conecta na VPS
        this.ssh.on('ready', () => {
            console.log('🖥️ Conectado na VPS via SSH');
            this.isConnected = true;
        });

        this.ssh.on('error', (err) => {
            console.error('❌ Erro na conexão VPS:', err);
            this.isConnected = false;
        });

        this.ssh.on('close', () => {
            console.log('🔌 Conexão VPS fechada');
            this.isConnected = false;
            // Reconecta após 5 segundos
            setTimeout(() => this.connect(), 5000);
        });
    }

    connect() {
        if (this.vpsConfig.host && this.vpsConfig.username && this.vpsConfig.password) {
            try {
                this.ssh.connect(this.vpsConfig);
            } catch (error) {
                console.error('❌ Erro ao conectar VPS:', error);
            }
        } else {
            console.log('⚠️ Configurações da VPS não definidas');
        }
    }

    listarArquivos(path) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                return reject(new Error('VPS não conectada'));
            }

            // Comando para Windows (dir) ou Linux (ls)
            const command = process.platform === 'win32' ? 
                `dir "${path}" /b` : 
                `ls -1 "${path}"`;

            this.ssh.exec(command, (err, stream) => {
                if (err) return reject(err);

                let output = '';
                let errorOutput = '';

                stream.on('data', (data) => {
                    output += data.toString();
                });

                stream.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                stream.on('close', (code) => {
                    if (code !== 0) {
                        return reject(new Error(`Comando falhou: ${errorOutput}`));
                    }

                    const items = output
                        .split(/\r?\n/)
                        .filter(item => item.trim())
                        .filter(item => !item.includes('bytes free')); // Remove info de espaço do Windows

                    resolve(items);
                });
            });
        });
    }

    async getFilmes() {
        try {
            const filmesPaths = [
                this.config.filmesPath || 'C:/Users/administrator/Desktop/Cinema/Filmes',
                '/home/cinema/filmes' // Alternativa Linux
            ].filter(path => path);

            for (const path of filmesPaths) {
                try {
                    const filmes = await this.listarArquivos(path);
                    if (filmes.length > 0) {
                        return {
                            success: true,
                            filmes,
                            path,
                            total: filmes.length
                        };
                    }
                } catch (error) {
                    continue; // Tenta próximo path
                }
            }

            return {
                success: false,
                error: 'Nenhum filme encontrado nos diretórios configurados'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getSeries() {
        try {
            const seriesPaths = [
                this.config.seriesPath || 'C:/Users/administrator/Desktop/Cinema/Series',
                '/home/cinema/series' // Alternativa Linux
            ].filter(path => path);

            for (const path of seriesPaths) {
                try {
                    const series = await this.listarArquivos(path);
                    if (series.length > 0) {
                        return {
                            success: true,
                            series,
                            path,
                            total: series.length
                        };
                    }
                } catch (error) {
                    continue; // Tenta próximo path
                }
            }

            return {
                success: false,
                error: 'Nenhuma série encontrada nos diretórios configurados'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getTemporadas(serieName, userNumber) {
        try {
            // Pega a lista de séries salva para este usuário
            const userSeriesList = this.seriesLists.get(userNumber);
            if (!userSeriesList || !userSeriesList.series.includes(serieName)) {
                return {
                    success: false,
                    error: 'Série não encontrada. Use /seriesd primeiro.'
                };
            }

            const seriesPath = userSeriesList.path;
            const temporadasPath = `${seriesPath}/${serieName}`;
            
            const temporadas = await this.listarArquivos(temporadasPath);
            
            return {
                success: true,
                temporadas,
                serieName,
                path: temporadasPath,
                total: temporadas.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getEpisodios(serieName, temporadaName, userNumber) {
        try {
            const userSeriesList = this.seriesLists.get(userNumber);
            if (!userSeriesList) {
                return {
                    success: false,
                    error: 'Dados da série não encontrados. Use /seriesd primeiro.'
                };
            }

            const episodiosPath = `${userSeriesList.path}/${serieName}/${temporadaName}`;
            const episodios = await this.listarArquivos(episodiosPath);
            
            return {
                success: true,
                episodios,
                serieName,
                temporadaName,
                path: episodiosPath,
                total: episodios.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    saveSeriesList(userNumber, seriesData) {
        this.seriesLists.set(userNumber, seriesData);
    }

    getVPSStatus() {
        return {
            connected: this.isConnected,
            host: this.vpsConfig.host || 'Não configurado',
            username: this.vpsConfig.username || 'Não configurado'
        };
    }

    disconnect() {
        if (this.ssh) {
            this.ssh.end();
        }
    }
	 // 🔥 Adicione isso
    start() {
        console.log("🔌 Iniciando conexão com VPS...");
        this.connect();
    }
}

module.exports = VPSCinemaHandler;
