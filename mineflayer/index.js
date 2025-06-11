const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const Vec3 = require('vec3')

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'SidBot',
  version: '1.20.4'
})

// 봇이 스폰되면 실행
bot.once('spawn', () => {
  console.log('봇이 스폰되었습니다!')
  
  // pathfinder 플러그인 로드
  bot.loadPlugin(pathfinder)
  const mcData = require('minecraft-data')(bot.version)
  const defaultMove = new Movements(bot, mcData)
  bot.pathfinder.setMovements(defaultMove)
})

// 채팅 이벤트 처리
bot.on('chat', (username, message) => {
  if (username === bot.username) return
  
  const command = message.toLowerCase()
  
  switch (command) {
    case 'jump':
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
      break
      
    case 'forward':
      bot.setControlState('forward', true)
      setTimeout(() => bot.setControlState('forward', false), 1000)
      break
      
    case 'back':
      bot.setControlState('back', true)
      setTimeout(() => bot.setControlState('back', false), 1000)
      break
      
    case 'left':
      bot.setControlState('left', true)
      setTimeout(() => bot.setControlState('left', false), 1000)
      break
      
    case 'right':
      bot.setControlState('right', true)
      setTimeout(() => bot.setControlState('right', false), 1000)
      break
      
    case 'inventory':
      const items = bot.inventory.items()
      console.log('인벤토리 아이템:', items.map(item => `${item.name} x${item.count}`))
      break
  }
})

// 에러 처리
bot.on('error', (err) => {
  console.error('봇 에러:', err)
})

bot.on('kicked', (reason) => {
  console.log('봇이 킥되었습니다:', reason)
}) 