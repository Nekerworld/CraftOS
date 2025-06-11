const mineflayer = require('mineflayer')
const BOT_CONFIG = {
  host: 'localhost',
  port: 60869,
  username: 'CraftOS',
  version: '1.21.5',  // 서버와 동일한 버전
  auth: 'offline'  // 오프라인 모드 명시
}
const bot = mineflayer.createBot(BOT_CONFIG)