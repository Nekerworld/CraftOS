const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const GPTHandler = require('./gpt')

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

// GPT 핸들러 초기화
const gptHandler = new GPTHandler()

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
    process.stdin.on('data', async (data) => {
      const input = data.toString().trim().toLowerCase()
      
      // 명령어 처리
      if (input.startsWith('/')) {
        const command = input.slice(1).toLowerCase()
        switch (command) {
          case 'help':
            console.log(`
              사용 가능한 명령어:
              /help - 도움말 표시
              /reset - 대화 초기화
              /follow - 플레이어 따라가기
              /stop - 따라가기 중지
              /history - 대화 기록 보기
              /clear - 대화 기록 삭제
            `)
            break
          case 'reset':
            console.log(gptHandler.resetConversation())
            break
          case 'follow':
            if (input.split(' ').length > 1) {
              targetPlayer = input.split(' ')[1]
              console.log(`${targetPlayer}님을 따라가기 시작합니다.`)
            } else {
              console.log('따라갈 플레이어 이름을 입력해주세요.')
            }
            break
          case 'stop':
            targetPlayer = null
            bot.pathfinder.stop()
            console.log('따라가기를 중지했습니다.')
            break
          case 'history':
            console.log(gptHandler.showConversationHistory())
            break
          case 'clear':
            console.log(gptHandler.deleteConversationHistory())
            break
          default:
            console.log('알 수 없는 명령어입니다. /help를 입력하여 사용 가능한 명령어를 확인하세요.')
        }
        return
      }

      // 일반 대화 처리
      if (input) {
        try {
          const response = await gptHandler.chat(input)
          console.log('봇:', response)
          bot.chat(response) // 인게임 채팅으로도 응답
        } catch (error) {
          console.error('GPT 응답 생성 중 오류:', error)
        }
      }
    })
  })

  // 플레이어 따라가기 로직
  bot.on('physicsTick', () => {
    if (isFollowing && targetPlayer) {
      const player = bot.players[targetPlayer]
      if (!player || !player.entity) {
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