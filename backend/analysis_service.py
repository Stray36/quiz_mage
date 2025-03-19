import json
import re
import logging
from config import get_model
import ast

logger = logging.getLogger(__name__)

# 修改function signature以接受quiz_json参数
def analyze_quiz_results(user_answers, quiz_json=None):
    """分析测验结果"""
    # 加载测验题目
    if quiz_json:
        # 使用传入的quiz_json
        logger.info("使用传入的quiz_json进行分析")
    else:
        # 从文件加载quiz_json（兼容旧版本）
        try:
            # 读取survey_json.js内容
            with open("../frontend/src/data/survey_json.js", 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 提取JSON部分 - 使用更安全的方法
            try:
                # 方法1: 使用正则表达式提取
                json_match = re.search(r'export const json = ({.+});$', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    quiz_json = json.loads(json_str)
                else:
                    # 方法2: 如果正则匹配失败，尝试使用ast模块解析
                    # 移除JavaScript部分，仅保留JSON对象
                    content = content.strip()
                    if content.startswith('export const json = ') and content.endswith(';'):
                        json_str = content[18:-1]  # 移除'export const json = '和末尾的';'
                        quiz_json = json.loads(json_str)
                    else:
                        # 方法3: 创建一个备用的JSON结构
                        logger.warning("无法解析测验JSON，使用默认结构")
                        quiz_json = create_default_quiz_json()
            except json.JSONDecodeError as e:
                logger.error(f"JSON解析错误: {str(e)}")
                # 尝试清理JSON字符串
                json_str = clean_json_string(json_match.group(1) if json_match else content)
                try:
                    quiz_json = json.loads(json_str)
                except:
                    logger.warning("清理后仍无法解析JSON，使用默认结构")
                    quiz_json = create_default_quiz_json()
        except Exception as e:
            logger.error(f"加载测验题目失败: {str(e)}")
            # 使用默认的测验结构而不是引发异常
            quiz_json = create_default_quiz_json()
    
    # 比较答案，找出错误的题目
    incorrect_questions = []
    correct_count = 0
    total_questions = 0
    
    try:
        # 假设测验结构有pages和elements
        for page in quiz_json.get('pages', []):
            for question in page.get('elements', []):
                question_id = question.get('name')
                if question_id and question_id in user_answers:
                    total_questions += 1
                    user_answer = user_answers[question_id]
                    correct_answer = question.get('correctAnswer')
                    
                    # 处理不同题型
                    if question.get('type') == 'text':  # 填空题
                        # 填空题可能需要更灵活的答案匹配
                        is_correct = user_answer.strip().lower() == correct_answer.strip().lower()
                        if not is_correct:
                            incorrect_questions.append({
                                'question': question.get('title'),
                                'userAnswer': user_answer,
                                'correctAnswer': correct_answer,
                                'type': 'text'  # 表明这是填空题
                            })
                        else:
                            correct_count += 1
                    else:  # 选择题或其他类型
                        if user_answer != correct_answer:
                            incorrect_questions.append({
                                'question': question.get('title'),
                                'userAnswer': user_answer,
                                'correctAnswer': correct_answer,
                                'options': question.get('choices'),
                                'type': 'radiogroup'  # 表明这是选择题
                            })
                        else:
                            correct_count += 1
    except Exception as e:
        logger.error(f"处理答案时出错: {str(e)}")
        # 继续执行，使用已收集的信息
    
    # 使用AI分析结果
    try:
        knowledge_analysis = generate_analysis(total_questions, correct_count, incorrect_questions)
    except Exception as e:
        logger.error(f"生成分析时出错: {str(e)}")
        knowledge_analysis = f"分析生成失败: {str(e)}，请稍后重试。"
    
    # 返回结果
    return {
        "totalQuestions": total_questions,
        "correctCount": correct_count,
        "incorrectCount": len(incorrect_questions),
        "incorrectQuestions": incorrect_questions,
        "knowledgeAnalysis": knowledge_analysis
    }

def clean_json_string(json_str):
    """清理JSON字符串中的问题"""
    # 替换一些可能导致问题的特殊序列
    replacements = [
        (r'\\(?!["\\/bfnrt])', r'\\\\'),  # 修复不正确的转义
        (r'(?<=[^\\])"(?=[^"]*"[^"]*$)', r'\\"'),  # 转义内部引号
        (r'[\x00-\x1F]', ''),  # 移除控制字符
    ]
    
    for pattern, replacement in replacements:
        json_str = re.sub(pattern, replacement, json_str)
    
    return json_str

def create_default_quiz_json():
    """创建一个默认的测验JSON结构"""
    return {
        "pages": [
            {
                "elements": [
                    {
                        "type": "radiogroup",
                        "name": "question1",
                        "title": "默认问题1",
                        "choices": ["选项1", "选项2", "选项3"],
                        "correctAnswer": "选项1"
                    }
                ]
            }
        ]
    }

def generate_analysis(total_questions, correct_count, incorrect_questions):
    """生成知识点分析"""
    model = get_model()
    
    # 如果没有错误题目，直接返回成功信息
    if not incorrect_questions:
        return "恭喜！您回答了所有问题正确。"
    
    analysis_prompt = f"""
    基于以下测验结果，分析用户的知识点掌握情况并提供改进建议。以“测试结果分析“作为题目

    总题数: {total_questions}
    正确答案: {correct_count}
    错误答案: {len(incorrect_questions)}
    
    以下是用户回答错误的题目:
    {json.dumps(incorrect_questions, ensure_ascii=False, indent=2)}
    
    请提供:
    1. 用户知识点不足的区域总结
    2. 具体的改进建议
    3. 错误答案中发现的任何模式
    
    请使用markdown格式输出你的分析。
    """
    
    try:
        analysis_response = model.generate_content(analysis_prompt)
        logger.info("成功生成知识点分析")
        return analysis_response.text
    except Exception as e:
        logger.error(f"生成分析失败: {str(e)}")
        return f"生成分析失败: {str(e)}"