/* ==========================================
   笙态AI Chat v2.0 - Simplified Logic
   ========================================== */

// 通义千问 API 配置
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const API_KEY = 'sk-ws-H.RPEMPMH.IJ6u.MEUCIEf6ls3xUkzP4vrmY5mm79BanDu0UFDMHwbvL7HsYDZTAiEAuep_7K5PH5rnCUe3_bTkjJcWMk54Q87Oya3dHW--qPI';

// 对话历史
let conversationHistory = [
  {
    role: "system",
    content: "你是一个友善、专业的AI助手，名字叫笙态。你的职责是帮助用户解答各种问题。回答要专业、友好、有帮助。请用中文回答。"
  }
];

// 自动调整输入框高度
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// 发送消息
async function sendMessage() {
  const input = document.getElementById('userInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // 禁用发送按钮
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  
  // 隐藏建议
  document.getElementById('suggestions').style.display = 'none';
  
  // 添加用户消息
  addMessage('user', message);
  input.value = '';
  input.style.height = 'auto';
  
  // 添加加载动画
  const typingId = addTypingIndicator();
  
  // 添加到对话历史
  conversationHistory.push({
    role: "user",
    content: message
  });
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: conversationHistory,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error('API请求失败: ' + response.status);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // 移除加载动画
    removeTypingIndicator(typingId);
    
    // 添加AI回复
    addMessage('ai', aiResponse);
    
    // 添加到对话历史
    conversationHistory.push({
      role: "assistant",
      content: aiResponse
    });
    
    // 保存到本地存储
    saveToLocalStorage();
    
  } catch (error) {
    console.error('API Error:', error);
    removeTypingIndicator(typingId);
    
    // 降级处理：如果API失败，使用本地回复
    const localResponse = getLocalResponse(message);
    addMessage('ai', localResponse);
    
    conversationHistory.push({
      role: "assistant",
      content: localResponse
    });
  }
  
  // 恢复发送按钮
  sendBtn.disabled = false;
  input.focus();
}

// 添加消息到聊天区域
function addMessage(type, content) {
  const container = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  
  const avatar = type === 'ai' ? '💫' : '👤';
  const bubbleClass = type === 'ai' ? 'ai-message' : 'user-message';
  
  // 格式化内容
  const formattedContent = formatContent(content);
  
  var messageDiv = document.createElement('div');
  messageDiv.className = 'message ' + bubbleClass;
  messageDiv.innerHTML = 
    '<div class="message-avatar">' + avatar + '</div>' +
    '<div class="message-content">' +
      '<div class="message-bubble">' + formattedContent + '</div>' +
      '<div class="message-time">' + time + '</div>' +
    '</div>';
  
  container.appendChild(messageDiv);
  
  // 滚动到底部
  container.scrollTop = container.scrollHeight;
}

// 添加打字指示器
function addTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const id = 'typing-' + Date.now();
  
  var typingDiv = document.createElement('div');
  typingDiv.className = 'message ai-message';
  typingDiv.id = id;
  typingDiv.innerHTML = 
    '<div class="message-avatar">💫</div>' +
    '<div class="message-content">' +
      '<div class="typing-indicator">' +
        '<span></span><span></span><span></span>' +
      '</div>' +
    '</div>';
  
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;
  
  return id;
}

// 移除打字指示器
function removeTypingIndicator(id) {
  var el = document.getElementById(id);
  if (el) el.remove();
}

// 格式化内容（支持Markdown简化语法）
function formatContent(content) {
  // 转义HTML
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // 粗体
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 斜体
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 代码块
  formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // 行内代码
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">$1</code>');
  
  // 列表项
  formatted = formatted.replace(/^[\s]*[-•]\s+(.+)$/gm, '<li>$1</li>');
  
  // 换行
  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = formatted.replace(/\n/g, '<br>');
  
  return '<p>' + formatted + '</p>';
}

// 建议问题点击
function sendSuggestion(btn) {
  var text = btn.textContent || btn.innerText;
  document.getElementById('userInput').value = text;
  sendMessage();
}

// 清空对话
function clearChat() {
  if (confirm('确定要清空当前对话吗？')) {
    document.getElementById('chatMessages').innerHTML = 
      '<div class="message ai-message">' +
        '<div class="message-avatar">💫</div>' +
        '<div class="message-content">' +
          '<div class="message-bubble">' +
            '<p>对话已清空！😊</p>' +
            '<p>有什么我可以帮助你的吗？</p>' +
          '</div>' +
          '<div class="message-time">刚刚</div>' +
        '</div>' +
      '</div>';
    
    document.getElementById('suggestions').style.display = 'block';
    
    // 重置对话历史
    conversationHistory = [
      {
        role: "system",
        content: "你是一个友善、专业的AI助手，名字叫笙态。你的职责是帮助用户解答各种问题。回答要专业、友好、有帮助。请用中文回答。"
      }
    ];
    
    // 清除本地存储
    localStorage.removeItem('shengtai-chat-history');
  }
}

// 本地降级回复（当API不可用时）
function getLocalResponse(message) {
  var lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('你好') || lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('嗨')) {
    return '你好！😊 我是笙态AI，很高兴为你服务！\n\n我可以帮你：\n• ✈️ 旅行规划和建议\n• 💼 职场问题咨询\n• 👶 育儿知识解答\n• 💡 创意灵感激发\n\n请问有什么我可以帮助你的吗？';
  }
  
  if (lowerMsg.includes('谢谢') || lowerMsg.includes('感谢') || lowerMsg.includes('thanks')) {
    return '不客气！😊 很高兴能帮到你。\n\n如果还有其他问题，随时问我！';
  }
  
  if (lowerMsg.includes('旅行') || lowerMsg.includes('旅游') || lowerMsg.includes('去哪') || lowerMsg.includes('蜜月')) {
    return '🌍 关于旅行规划，我可以帮你：\n\n• 推荐热门/小众目的地\n• 制定详细行程安排\n• 提供签证、住宿建议\n• 预算控制和省钱技巧\n\n请问你想去哪里旅行呢？🎒';
  }
  
  if (lowerMsg.includes('工作') || lowerMsg.includes('职场') || lowerMsg.includes('面试') || lowerMsg.includes('简历')) {
    return '💼 关于职场问题，我可以帮你：\n\n• 简历优化和建议\n• 面试技巧准备\n• 职业规划咨询\n• 职场沟通技巧\n\n请问你现在遇到什么职场困惑呢？';
  }
  
  if (lowerMsg.includes('孩子') || lowerMsg.includes('育儿') || lowerMsg.includes('教育') || lowerMsg.includes('宝宝')) {
    return '👶 关于育儿教育，我很乐意帮忙：\n\n• 各年龄段育儿知识\n• 亲子沟通技巧\n• 学习方法建议\n• 行为习惯培养\n\n请问孩子多大了？有什么具体问题吗？';
  }
  
  if (lowerMsg.includes('帮') || lowerMsg.includes('推荐') || lowerMsg.includes('能做什么')) {
    return '💡 我可以帮你做很多事情：\n\n• ✈️ 旅行规划和建议\n• 💼 职场问题咨询\n• 👶 育儿知识解答\n• 💡 创意灵感激发\n• 📝 文案写作协助\n• 🔍 问题分析与解决\n\n请告诉我你的具体需求吧！';
  }

  if (lowerMsg.includes('日本') || lowerMsg.includes('japan')) {
    return '🇯🇵 日本是一个非常适合旅行的目的地！\n\n热门推荐：\n• 东京 — 潮流与文化融合\n• 京都 — 千年古都，寺庙众多\n• 大阪 — 美食天堂\n• 北海道 — 自然风光\n\n需要我帮你规划详细行程吗？包括交通、住宿、美食推荐～';
  }
  
  return '感谢你的提问！🙏\n\n很抱歉，目前 AI 服务可能正在调整中。\n你可以：\n1. 稍后再试\n2. 换个关键词试试\n3. 告诉我更多细节\n\n我会尽力帮助你！😊';
}

// 保存到本地存储
function saveToLocalStorage() {
  try {
    localStorage.setItem('shengtai-chat-history', JSON.stringify(conversationHistory));
  } catch (e) {
    console.log('存储空间不足');
  }
}

// 从本地存储加载
function loadFromLocalStorage() {
  try {
    var saved = localStorage.getItem('shengtai-chat-history');
    if (saved) {
      conversationHistory = JSON.parse(saved);
      // 渲染历史消息（跳过system消息）
      var hasHistory = false;
      conversationHistory.forEach(function(msg) {
        if (msg.role !== 'system') {
          addMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
          hasHistory = true;
        }
      });
      if (hasHistory) {
        document.getElementById('suggestions').style.display = 'none';
      }
    }
  } catch (e) {
    console.log('加载历史失败');
  }
}

// 新建对话
function newChat() {
  conversationHistory = [
    {
      role: "system",
      content: "你是一个友善、专业的AI助手，名字叫笙态。你的职责是帮助用户解答各种问题。回答要专业、友好、有帮助。请用中文回答。"
    }
  ];
  
  document.getElementById('chatMessages').innerHTML = 
    '<div class="message ai-message">' +
      '<div class="message-avatar">💫</div>' +
      '<div class="message-content">' +
        '<div class="message-bubble">' +
          '<p>👋 你好！我是 <strong>笙态AI</strong>！</p>' +
          '<p>✨ 完全免费，无限使用！</p>' +
          '<p style="margin-top:16px">请随时告诉我你的问题或需求，我会尽力帮助你！😊</p>' +
        '</div>' +
        '<div class="message-time">刚刚</div>' +
      '</div>' +
    '</div>';
  
  document.getElementById('suggestions').style.display = 'block';
  localStorage.removeItem('shengtai-chat-history');
}

// 页面加载时
document.addEventListener('DOMContentLoaded', function() {
  // 加载历史记录
  loadFromLocalStorage();
  
  // 自动聚焦输入框
  document.getElementById('userInput').focus();
});
