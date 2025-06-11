const mineflayer = require('mineflayer')
const options = {
  host: 'localhost',
  port: 53484,
  username: 'CraftOS',
  version: '1.21.4',
}
const bot = mineflayer.createBot(options)

const welcome = () => {
  bot.chat('안녕하세요!')
}
bot.once('spawn', welcome)