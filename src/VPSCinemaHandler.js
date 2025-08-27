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

        console.log(`🔧 Configurando VPS: ${this.vpsConfig.host} (${this.vpsConfig.username})`);

        // Conecta na VPS
        this.ssh.on('ready', () => {
            console.log('🖥️ Conectado na VPS via SSH');
            this.isConnected = true;
        });

        this.ssh.on('error', (err) => {
            console.error('❌ Erro na conexão VPS:', err.message);
            this.isConnected = false;
        });

        this.ssh.on('close', () => {
            console.log('🔌 Conexão VPS fechada');
            this.isConnected = false;
            // Reconecta após 10 segundos
            setTimeout(() => {
                if (this.vpsConfig.host && this.vpsConfig.username && this.vpsConfig.password) {
                    console.log('🔄 Tentando reconectar VPS...');
                    this.connect();
                }
            }, 10000);
        });
    }

    connect() {
        if (this.vpsConfig.host && this.vpsConfig.username && this.vpsConfig.password) {
            try {
                console.log(`🔗 Conectando na VPS: ${this.vpsConfig.host}:${this.vpsConfig.port}`);
                this.ssh.connect(this.vpsConfig);
            } catch (error) {
                console.error('❌ Erro ao conectar VPS:', error);
            }
        } else {
            console.log('⚠️ Configurações da VPS incompletas:');
            console.log(`- Host: ${this.vpsConfig.host || 'FALTANDO'}`);
            console.log(`- Username: ${this.vpsConfig.username || 'FALTANDO'}`);
            console.log(`- Password: ${this.vpsConfig.password ? 'OK' : 'FALTANDO'}`);
        }
    }

    // Método melhorado para detecção do SO
    detectOS() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                return reject(new Error('VPS não conectada'));
            }

            this.ssh.exec('ver', (err, stream) => {
                if (err) {
                    // Se 'ver' falha, provavelmente é Linux
                    resolve('linux');
                    return;
                }

                let output = '';
                stream.on('data', (data) => {
                    output += data.toString();
                });

                stream.on('close', (code) => {
                    if (output.includes('Windows') || output.includes('Microsoft')) {
                        resolve('windows');
                    } else {
                        resolve('linux');
                    }
                });
            });
        });
    }

    listarArquivos(path) {
        return new Promise(async (resolve, reject) => {
            if (!this.isConnected) {
                return reject(new Error('VPS não conectada'));
            }

            try {
                // Detecta o sistema operacional
                const os = await this.detectOS();
                console.log(`🖥️ Sistema detectado: ${os}`);

                let command;
                if (os === 'windows') {
                    // Normaliza o caminho para Windows (converte / para \)
                    const windowsPath = path.replace(/\//g, '\\');
                    
                    // Comando mais robusto para Windows
                    command = `powershell -Command "try { if (Test-Path '${windowsPath}') { Get-ChildItem -Path '${windowsPath}' -Name -ErrorAction Stop | Out-String } else { 'PATH_NOT_FOUND' } } catch { 'ERROR: ' + $_.Exception.Message }"`;
                } else {
                    // Para Linux/Unix
                    command = `ls -1 "${path}" 2>/dev/null || echo "PATH_NOT_FOUND"`;
                }

                console.log(`📋 Executando comando: ${command}`);

                this.ssh.exec(command, (err, stream) => {
                    if (err) {
                        console.error('❌ Erro ao executar comando SSH:', err);
                        return reject(err);
                    }

                    let output = '';
                    let errorOutput = '';

                    stream.on('data', (data) => {
                        output += data.toString();
                    });

                    stream.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                    });

                    stream.on('close', (code) => {
                        console.log(`📊 Comando finalizado com código: ${code}`);
                        console.log(`📤 Saída bruta: "${output}"`);
                        
                        if (errorOutput) {
                            console.log(`❌ Erro: "${errorOutput}"`);
                        }

                        const outputTrimmed = output.trim();
                        
                        // Verifica se o diretório não existe
                        if (outputTrimmed.includes('PATH_NOT_FOUND')) {
                            console.log(`❌ Diretório não encontrado: ${path}`);
                            return resolve([]);
                        }

                        // Verifica se houve erro no PowerShell
                        if (outputTrimmed.startsWith('ERROR:')) {
                            console.log(`❌ Erro do PowerShell: ${outputTrimmed}`);
                            return resolve([]);
                        }

                        // Se não há saída, retorna array vazio
                        if (!outputTrimmed) {
                            console.log(`📂 Diretório vazio: ${path}`);
                            return resolve([]);
                        }

                        // Processa a saída
                        const items = outputTrimmed
                            .split(/\r?\n/)
                            .map(item => item.trim())
                            .filter(item => {
                                // Remove linhas vazias e saídas de erro do PowerShell
                                return item && 
                                       !item.includes('Get-ChildItem') &&
                                       !item.startsWith('At line:') &&
                                       !item.startsWith('CategoryInfo') &&
                                       !item.startsWith('FullyQualifiedErrorId') &&
                                       !item.startsWith('ERROR:');
                            });

                        console.log(`📁 Itens processados encontrados em ${path}:`, items.length);
                        console.log(`📋 Itens: [${items.join(', ')}]`);
                        resolve(items);
                    });
                });

            } catch (error) {
                console.error('❌ Erro na detecção do SO:', error);
                reject(error);
            }
        });
    }

    async getFilmes() {
        try {
            // Usa apenas o caminho configurado primeiro
            const filmesPath = this.config.VPS?.filmesPath;
            
            if (!filmesPath) {
                return {
                    success: false,
                    error: 'Caminho dos filmes não configurado no dono.json'
                };
            }

            console.log(`🎬 Buscando filmes em: ${filmesPath}`);
            
            const filmes = await this.listarArquivos(filmesPath);
            
            if (filmes.length > 0) {
                return {
                    success: true,
                    filmes,
                    path: filmesPath,
                    total: filmes.length
                };
            }

            return {
                success: false,
                error: `Nenhum filme encontrado no diretório: ${filmesPath}`
            };

        } catch (error) {
            console.error('❌ Erro ao buscar filmes:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }



    async getSeries() {
        try {
            // Usa apenas o caminho configurado primeiro
            const seriesPath = this.config.VPS?.seriesPath;
            
            if (!seriesPath) {
                return {
                    success: false,
                    error: 'Caminho das séries não configurado no dono.json'
                };
            }

            console.log(`📺 Buscando séries em: ${seriesPath}`);
            
            const series = await this.listarArquivos(seriesPath);
            
            if (series.length > 0) {
                return {
                    success: true,
                    series,
                    path: seriesPath,
                    total: series.length
                };
            }

            return {
                success: false,
                error: `Nenhuma série encontrada no diretório: ${seriesPath}`
            };

        } catch (error) {
            console.error('❌ Erro ao buscar séries:', error);
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
            
            // Normaliza o caminho (tanto para Linux quanto Windows)
            const temporadasPath = seriesPath.endsWith('/') || seriesPath.endsWith('\\') 
                ? `${seriesPath}${serieName}` 
                : `${seriesPath}/${serieName}`;
            
            console.log(`📺 Buscando temporadas em: ${temporadasPath}`);
            const temporadas = await this.listarArquivos(temporadasPath);
            
            return {
                success: true,
                temporadas,
                serieName,
                path: temporadasPath,
                total: temporadas.length
            };

        } catch (error) {
            console.error('❌ Erro ao buscar temporadas:', error);
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
            console.log(`📺 Buscando episódios em: ${episodiosPath}`);
            
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
            console.error('❌ Erro ao buscar episódios:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Método para testar conectividade e comandos
    async testConnection() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                return reject(new Error('VPS não conectada'));
            }

            // Teste básico
            this.ssh.exec('echo "Teste de conexão SSH"', (err, stream) => {
                if (err) return reject(err);

                let output = '';
                stream.on('data', (data) => {
                    output += data.toString();
                });

                stream.on('close', (code) => {
                    console.log(`✅ Teste de conexão: ${output.trim()}`);
                    resolve({ success: true, output: output.trim(), code });
                });
            });
        });
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

    // Método para iniciar a conexão VPS
    start() {
        console.log("🔌 Iniciando conexão com VPS...");
        this.connect();
    }
}

module.exports = VPSCinemaHandler;
