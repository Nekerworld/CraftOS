const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')

const options = {
  host: 'localhost',
  port: 12345,
  username: 'CraftOS',
  version: '1.21.4',
}

let bot = null
let isFollowing = false
let targetPlayer = null
const FOLLOW_DISTANCE = 2
const SPRINT_DISTANCE = 3 // 이 거리 이상 멀어지면 뛰기 시작

// 이동 속도 설정
const MOVEMENT_SPEED = {
  forward: 1.0,
  backward: 0.8,
  left: 0.8,
  right: 0.8
}

const createBot = () => {
  bot = mineflayer.createBot(options)
  
  // 연결 에러 처리
  bot.on('error', (err) => {
    console.error('봇 에러 발생:', err)
  })

  // 연결 종료 처리
  bot.on('end', () => {
    console.log('봇 연결이 종료되었습니다. 재연결을 시도합니다...')
    setTimeout(createBot, 5000)
  })

  // 일반적인 에러 처리
  bot.on('kicked', (reason) => {
    console.log('봇이 서버에서 추방되었습니다:', reason)
  })

  // 연결 성공 시
  bot.once('spawn', () => {
    console.log('봇이 성공적으로 연결되었습니다!')
    bot.chat('안녕하세요!')
    
    // 키보드 입력 처리
    process.stdin.on('data', (data) => {
      const key = data.toString().trim().toLowerCase()
      
      switch(key) {
        case 'w':
          bot.setControlState('forward', true)
          setTimeout(() => bot.setControlState('forward', false), 100)
          break
        case 's':
          bot.setControlState('back', true)
          setTimeout(() => bot.setControlState('back', false), 100)
          break
        case 'a':
          bot.setControlState('left', true)
          setTimeout(() => bot.setControlState('left', false), 100)
          break
        case 'd':
          bot.setControlState('right', true)
          setTimeout(() => bot.setControlState('right', false), 100)
          break
        case 'f':
          isFollowing = !isFollowing
          if (isFollowing) {
            const players = Object.keys(bot.players)
            if (players.length > 0) {
              targetPlayer = bot.players[players[0]].username
              console.log(`${targetPlayer}를 따라갑니다.`)
            } else {
              console.log('따라갈 플레이어가 없습니다.')
              isFollowing = false
            }
          } else {
            console.log('따라가기를 중지합니다.')
            targetPlayer = null
            bot.setControlState('sprint', false)
          }
          break
      }
    })
  })

  // 플레이어 따라가기 로직
  bot.on('physicsTick', () => {
    if (isFollowing && targetPlayer) {
      const player = bot.players[targetPlayer]
      if (!player) {
        console.log('대상 플레이어를 찾을 수 없습니다.')
        isFollowing = false
        bot.setControlState('sprint', false)
        return
      }

      const target = player.entity.position
      const botPos = bot.entity.position
      const distance = botPos.distanceTo(target)

      if (distance > FOLLOW_DISTANCE) {
        bot.lookAt(target)
        bot.setControlState('forward', true)
        
        // 거리가 SPRINT_DISTANCE보다 멀어지면 뛰기 시작
        if (distance > SPRINT_DISTANCE) {
          bot.setControlState('sprint', true)
          console.log('거리가 멀어져서 뛰기 시작합니다!')
        } else {
          bot.setControlState('sprint', false)
        }
      } else {
        bot.setControlState('forward', false)
        bot.setControlState('sprint', false)
      }
    }
  })
}

createBot()