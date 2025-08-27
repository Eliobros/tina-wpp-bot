const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'dono', 'dono.json');

function readConfig() {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
}

function writeConfig(config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

function ensureGroupMap(config) {
    if (!config.GroupAntiSystems) {
        config.GroupAntiSystems = {};
    }
}

function getGroupFlags(groupId) {
    const config = readConfig();
    ensureGroupMap(config);
    return config.GroupAntiSystems[groupId] || {};
}

function setGroupFlag(groupId, flagName, enabled) {
    const config = readConfig();
    ensureGroupMap(config);
    if (!config.GroupAntiSystems[groupId]) {
        config.GroupAntiSystems[groupId] = {};
    }
    config.GroupAntiSystems[groupId][flagName] = enabled;
    writeConfig(config);
}

module.exports = {
    readConfig,
    writeConfig,
    getGroupFlags,
    setGroupFlag
};

