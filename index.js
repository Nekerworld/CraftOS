const mineflayer = require('mineflayer')
const options = {
  host: 'localhost',
  port: 53484,
  username: 'CraftOS',
  version: '1.21.4',
}

let bot = null

const createBot = () => {
  bot = mineflayer.createBot(options)
  
  // 연결 에러 처리
  bot.on('error', (err) => {
    console.error('봇 에러 발생:', err)
  })

  // 연결 종료 처리
  bot.on('end', () => {
    console.log('봇 연결이 종료되었습니다. 재연결을 시도합니다...')
    setTimeout(createBot, 5000) // 5초 후 재연결 시도
  })

  // 일반적인 에러 처리
  bot.on('kicked', (reason) => {
    console.log('봇이 서버에서 추방되었습니다:', reason)
  })

  // 연결 성공 시
  bot.once('spawn', () => {
    console.log('봇이 성공적으로 연결되었습니다!')
    bot.chat('안녕하세요!')
  })
}

createBot()