const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

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
const JUMP_HEIGHT = 1 // 자동 점프를 시작할 높이 차이

// 이동 속도 설정
const MOVEMENT_SPEED = {
  forward: 1.0,
  backward: 0.8,
  left: 0.8,
  right: 0.8
}

const createBot = () => {
  bot = mineflayer.createBot(options)
  
  // pathfinder 플러그인 로드
  bot.loadPlugin(pathfinder)

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
    
    // pathfinder 설정
    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.allowSprinting = true
    movements.canDig = false
    bot.pathfinder.setMovements(movements)
    
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
        case ' ': // 스페이스바로 점프
          bot.setControlState('jump', true)
          setTimeout(() => bot.setControlState('jump', false), 100)
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
            bot.setControlState('jump', false)
            bot.pathfinder.stop()
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
        bot.setControlState('jump', false)
        bot.pathfinder.stop()
        return
      }

      const target = player.entity.position
      const botPos = bot.entity.position
      const distance = botPos.distanceTo(target)

      if (distance > FOLLOW_DISTANCE) {
        // pathfinder를 사용하여 경로 찾기
        const goal = new goals.GoalFollow(player.entity, FOLLOW_DISTANCE)
        bot.pathfinder.setGoal(goal, true)
        
        // 거리가 SPRINT_DISTANCE보다 멀어지면 뛰기 시작
        if (distance > SPRINT_DISTANCE) {
          bot.setControlState('sprint', true)
        } else {
          bot.setControlState('sprint', false)
        }
      } else {
        bot.pathfinder.stop()
        bot.setControlState('sprint', false)
      }
    }
  })

  // pathfinder 이벤트 처리
  bot.on('path_update', (results) => {
    if (results.status === 'noPath') {
      console.log('경로를 찾을 수 없습니다!')
    }
  })
}

createBot()