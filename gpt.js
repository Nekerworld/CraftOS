const { OpenAI } = require('openai')
const config = require('./config')
const fs = require('fs')
const path = require('path')

class GPTHandler {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    })
    this.conversationHistory = []
    this.historyFile = path.join(__dirname, 'conversation_history.json')
    this.loadConversationHistory()
  }

  // 마인크래프트 용어 변환
  convertMinecraftTerms(text) {
    const terms = {
      'minecraft': '마인크래프트',
      'diamond': '다이아몬드',
      'iron': '철',
      'gold': '금',
      'emerald': '에메랄드',
      'netherite': '네더라이트',
      'ender': '엔더',
      'obsidian': '흑요석',
      'redstone': '레드스톤',
      'crafting': '제작',
      'enchanting': '인챈트',
      'potion': '물약',
      'spawn': '스폰',
      'respawn': '리스폰',
      'mob': '몬스터',
      'creeper': '크리퍼',
      'zombie': '좀비',
      'skeleton': '스켈레톤',
      'enderman': '엔더맨',
      'villager': '주민',
      'biome': '바이옴',
      'overworld': '오버월드',
      'nether': '네더',
      'end': '엔드',
      'portal': '포탈',
      'bedrock': '베드락',
      'survival': '서바이벌',
      'creative': '크리에이티브',
      'adventure': '어드벤처',
      'spectator': '관전자',
      'gamemode': '게임모드',
      'difficulty': '난이도',
      'peaceful': '평화로움',
      'easy': '쉬움',
      'normal': '보통',
      'hard': '어려움',
      'hardcore': '하드코어'
    }

    let convertedText = text
    for (const [eng, kor] of Object.entries(terms)) {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi')
      convertedText = convertedText.replace(regex, kor)
    }
    return convertedText
  }

  // 코드 블록 포맷팅
  formatCodeBlocks(text) {
    return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `\n[코드 블록 - ${lang || '일반'}]\n${code.trim()}\n[/코드 블록]\n`
    })
  }

  // 이모지 변환
  convertEmojis(text) {
    const emojis = {
      ':D': '😄',
      ':-)': '😊',
      ':-(': '😢',
      ':-P': '😛',
      ';-)': '😉',
      '<3': '❤️',
      ':-O': '😮',
      ':-*': '😘',
      '>:-(': '😠',
      ':-|': '😐',
      ':-3': '😊',
      'xD': '😆'
    }

    let convertedText = text
    for (const [text, emoji] of Object.entries(emojis)) {
      // 특수문자를 이스케이프 처리
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escapedText, 'g')
      convertedText = convertedText.replace(regex, emoji)
    }
    return convertedText
  }

  // 응답 포맷팅
  formatResponse(text) {
    let formattedText = text

    // 마인크래프트 용어 변환
    formattedText = this.convertMinecraftTerms(formattedText)

    // 코드 블록 포맷팅
    formattedText = this.formatCodeBlocks(formattedText)

    // 이모지 변환
    formattedText = this.convertEmojis(formattedText)

    // 줄바꿈 정리
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n')

    return formattedText
  }

  // 대화 기록 저장
  saveConversationHistory() {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(this.conversationHistory, null, 2))
      console.log('대화 기록이 저장되었습니다.')
    } catch (error) {
      console.error('대화 기록 저장 중 오류:', error)
    }
  }

  // 대화 기록 불러오기
  loadConversationHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8')
        this.conversationHistory = JSON.parse(data)
        console.log('이전 대화 기록을 불러왔습니다.')
      }
    } catch (error) {
      console.error('대화 기록 불러오기 중 오류:', error)
      this.conversationHistory = []
    }
  }

  // 대화 기록 초기화
  resetConversation() {
    this.conversationHistory = []
    this.saveConversationHistory()
    return '대화 기록이 초기화되었습니다.'
  }

  // 대화 기록 가져오기
  getConversationHistory() {
    return this.conversationHistory
  }

  // 대화 기록 삭제
  deleteConversationHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        fs.unlinkSync(this.historyFile)
        this.conversationHistory = []
        return '대화 기록 파일이 삭제되었습니다.'
      }
      return '삭제할 대화 기록 파일이 없습니다.'
    } catch (error) {
      console.error('대화 기록 삭제 중 오류:', error)
      return '대화 기록 삭제 중 오류가 발생했습니다.'
    }
  }

  // 대화 기록 표시
  showConversationHistory() {
    if (this.conversationHistory.length === 0) {
      return '저장된 대화 기록이 없습니다.'
    }

    let history = '=== 대화 기록 ===\n'
    this.conversationHistory.forEach((msg, index) => {
      const role = msg.role === 'user' ? '사용자' : '봇'
      history += `${index + 1}. [${role}] ${msg.content}\n`
    })
    return history
  }

  async chat(message) {
    try {
      // 대화 기록에 사용자 메시지 추가
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      })

      // GPT API 호출
      const response = await this.openai.chat.completions.create({
        model: config.bot.model,
        messages: [
          {
            role: 'system',
            content: '당신은 마인크래프트 봇입니다. 마인크래프트를 플레이하는 하나의 플레이어처럼 답변해주세요. 당신의 이름은 CraftOS 입니다.'
          },
          ...this.conversationHistory
        ],
        temperature: config.bot.temperature,
        max_tokens: config.bot.maxTokens
      })

      // 응답을 대화 기록에 추가
      const botResponse = response.choices[0].message.content
      const formattedResponse = this.formatResponse(botResponse)
      
      this.conversationHistory.push({
        role: 'assistant',
        content: formattedResponse,
        timestamp: new Date().toISOString()
      })

      // 대화 기록 저장
      this.saveConversationHistory()

      return formattedResponse
    } catch (error) {
      console.error('GPT API 오류:', error)
      return '죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다.'
    }
  }
}

module.exports = GPTHandler 