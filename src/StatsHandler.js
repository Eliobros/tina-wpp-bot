// src/StatsHandler.js
const fs = require('fs');
const path = require('path');

class StatsHandler {
    constructor(config) {
        this.config = config;
        this.configPath = path.join(__dirname, '..', 'dono', 'dono.json');
    }

    updateUserStats(userNumber, userName, groupId, groupName) {
        try {
            // Lê configurações atuais
            const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            if (!configData.UsuariosStats) configData.UsuariosStats = {};
            if (!configData.GruposStats) configData.GruposStats = {};

            const now = Date.now();
            const userId = `${userNumber}@${groupId}`;

            // Atualiza stats do usuário no grupo
            if (!configData.UsuariosStats[userId]) {
                configData.UsuariosStats[userId] = {
                    userNumber,
                    userName,
                    groupId,
                    groupName,
                    messageCount: 0,
                    firstSeen: now,
                    lastSeen: now
                };
            }

            configData.UsuariosStats[userId].messageCount++;
            configData.UsuariosStats[userId].lastSeen = now;
            configData.UsuariosStats[userId].userName = userName; // Atualiza nome

            // Atualiza stats do grupo
            if (!configData.GruposStats[groupId]) {
                configData.GruposStats[groupId] = {
                    groupName,
                    totalMessages: 0,
                    botJoinedAt: now
                };
            }

            configData.GruposStats[groupId].totalMessages++;
            configData.GruposStats[groupId].groupName = groupName; // Atualiza nome

            // Salva no arquivo
            fs.writeFileSync(this.configPath, JSON.stringify(configData, null, 2), 'utf8');

        } catch (error) {
            console.error('Erro ao atualizar stats:', error);
        }
    }

    getUsersStats(groupId) {
        try {
            const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            if (!configData.UsuariosStats) return [];

            // Filtra usuários do grupo específico
            const groupUsers = Object.values(configData.UsuariosStats)
                .filter(user => user.groupId === groupId)
                .sort((a, b) => b.messageCount - a.messageCount);

            return groupUsers;

        } catch (error) {
            console.error('Erro ao buscar stats:', error);
            return [];
        }
    }

    getInactiveUsers(groupId, daysInactive = 7) {
        try {
            const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            if (!configData.UsuariosStats) return [];

            const cutoffTime = Date.now() - (daysInactive * 24 * 60 * 60 * 1000);

            // Filtra usuários inativos no grupo
            const inactiveUsers = Object.values(configData.UsuariosStats)
                .filter(user => user.groupId === groupId)
                .filter(user => user.messageCount === 0 || user.lastSeen < cutoffTime);

            return inactiveUsers;

        } catch (error) {
            console.error('Erro ao buscar usuários inativos:', error);
            return [];
        }
    }

    removeUserStats(userNumbers, groupId) {
        try {
            const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            if (!configData.UsuariosStats) return;

            // Remove stats dos usuários especificados
            userNumbers.forEach(userNumber => {
                const userId = `${userNumber}@${groupId}`;
                delete configData.UsuariosStats[userId];
            });

            // Salva no arquivo
            fs.writeFileSync(this.configPath, JSON.stringify(configData, null, 2), 'utf8');

        } catch (error) {
            console.error('Erro ao remover stats:', error);
        }
    }
}

module.exports = StatsHandler;
