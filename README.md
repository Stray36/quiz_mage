# Auto Quiz - 基于知识库的智能测验生成器

Auto Quiz 是一个智能测验生成工具，可以从上传的知识库文档中自动生成测验题目，并提供详细的测验结果分析和学习建议。


## 主要功能

### 📚 智能测验生成
- **多文档格式支持**：支持上传 PDF 和 TXT 格式的知识文档
- **自定义测验**：可设置题目数量、难度等级和题目类型
- **题型多样**：支持选择题和填空题
- **历史记录**：查看之前生成的所有测验

### 📊 全面结果分析
- **即时反馈**：完成测验后立即获取成绩和错题分析
- **知识点评估**：AI 分析知识掌握情况，找出薄弱环节
- **个性化建议**：提供针对性的学习建议
- **分析历史**：随时回顾之前的测验分析结果

### 🔧 灵活配置选项
- **难度调节**：简单、中等、困难三个难度等级
- **题目数量**：自定义生成题目的数量
- **备注功能**：添加特殊需求，定制化生成测验内容

## 技术栈

- **前端**：React、Material UI、Survey.js
- **后端**：Flask (Python)
- **AI 模型**：Gemini API
- **数据存储**：SQLite
- **文档处理**：PyPDF2

## 快速开始

### 系统要求
- Node.js 14.x 或更高版本
- Python 3.8 或更高版本
- 稳定的网络连接（用于AI模型调用）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/auto_quiz.git
   cd auto_quiz
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **安装前端依赖**
   ```bash
   cd ../frontend
   npm install
   ```

4. **配置环境变量**
   - 在 backend 目录下创建 .env 文件
   - 添加以下内容，替换 `YOUR_API_KEY` 为你的 Gemini API 密钥：
   ```
   API_URL=https://generativelanguage.googleapis.com/v1beta
   API_KEY=YOUR_API_KEY
   MODEL=gemini-2.0-flash
   ```
   
5. **启动应用**
   ```bash
   # 在项目根目录下运行
   ./start.sh
   # 如果权限不足，先运行: chmod +x start.sh
   ```
   
6. **访问应用**  
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 使用流程

1. **首页上传文档**
   - 选择 PDF 或 TXT 格式的知识文档
   - 设置题目数量、难度和题型
   - 可选：添加特殊需求备注
   - 点击"生成测验"按钮

2. **进行测验**
   - 自动跳转到测验页面
   - 回答所有问题
   - 点击提交按钮

3. **查看分析**
   - 自动跳转到分析页面
   - 查看测验结果和错题解析
   - 阅读AI生成的知识点分析和学习建议

4. **浏览历史**
   - 点击顶部"测验"查看测验历史
   - 点击顶部"分析"查看分析历史
