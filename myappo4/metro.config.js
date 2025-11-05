// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// block warning พวกที่ใช้เฉพาะ web ออกไป
config.resolver.blockList = [/asn1\.js/, /vm/];

module.exports = config;
