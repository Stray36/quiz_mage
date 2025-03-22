import os
import json
import logging
from config import get_model

logger = logging.getLogger(__name__)

def generate_quiz(content, question_count, difficulty, include_multiple_choice=True, include_fill_in_blank=False, notes=None):
    """生成测验题目"""
    model = get_model()
    example_json = json.loads(os.getenv('EXAMPLE_JSON'))
    
    # 构建题型要求
    question_type_requirements = []
    if include_multiple_choice and include_fill_in_blank:
        question_type_requirements.append("请混合生成选择题和填空题")
        question_type_requirements.append("选择题使用'radiogroup'类型，填空题使用'text'类型")
        question_type_requirements.append("填空题的格式为: {\"type\": \"text\", \"name\": \"questionX\", \"title\": \"题目内容\", \"isRequired\": true, \"correctAnswer\": \"正确答案\"}")
    elif include_fill_in_blank:
        question_type_requirements.append("请仅生成填空题")
        question_type_requirements.append("填空题使用'text'类型")
        question_type_requirements.append("填空题的格式为: {\"type\": \"text\", \"name\": \"questionX\", \"title\": \"题目内容\", \"isRequired\": true, \"correctAnswer\": \"正确答案\"}")
    else:  # 默认为选择题
        question_type_requirements.append("请仅生成选择题")
        question_type_requirements.append("选择题使用'radiogroup'类型")
    
    # 构建基本提示
    prompt_base = f"""
    你是一个专业的考试出题专家。请根据以下内容生成{question_count}道{difficulty}难度的题目。
    
    题型要求：
    {chr(10).join(question_type_requirements)}
    
    一般要求：
    1. 每个选择题必须有4个选项
    2. 所有题目必须指定正确答案
    3. 题目难度要符合{difficulty}级别
    4. 必须严格按照提供的JSON格式生成
    5. 必须确保生成的是合法的JSON格式
    """
    
    # 如果有备注信息，添加到提示中
    if notes and notes.strip():
        prompt_base += f"""
    6. 特别要求: {notes}
    """
    
    # 完成提示
    prompt = prompt_base + f"""
    参考内容:
    {content[:3000]}
    
    请严格按照以下JSON格式生成（不要添加任何其他文本）:
    {json.dumps(example_json, indent=2, ensure_ascii=False)}
    """

    try:
        response = model.generate_content(prompt)
        logger.info("测验内容生成成功")
        response_text = response.text.strip()
        
        # 尝试清理响应文本以获取有效的JSON
        # 找到第一个 { 和最后一个 }
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            
            # 额外的清理步骤
            json_str = json_str.replace('\n', ' ')  # 移除换行符
            json_str = ' '.join(json_str.split())   # 规范化空白字符
            
            # 尝试解析JSON
            try:
                quiz_json = json.loads(json_str)
                return quiz_json
            except json.JSONDecodeError as je:
                logger.error(f"JSON parsing error: {str(je)}")
                logger.error(f"Attempted to parse: {json_str}")
                raise ValueError(f"生成的内容不是有效的JSON格式: {str(je)}")
        else:
            raise ValueError("响应中未找到有效的JSON格式内容")
            
    except Exception as e:
        logger.error(f"生成测验失败: {str(e)}")
        logger.error(f"原始响应: {response_text if 'response_text' in locals() else '未获取到响应'}")
        raise ValueError(f"生成测验失败: {str(e)}")

def update_survey_json(quiz_json):
    """更新测验JSON文件"""
    survey_json_path = "../frontend/src/data/survey_json.js"
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(survey_json_path), exist_ok=True)
        
        # Write the JSON data to the file
        with open(survey_json_path, 'w', encoding='utf-8') as f:
            f.write(f"export const json = {json.dumps(quiz_json, indent=2, ensure_ascii=False)};")
        logger.info(f"成功更新测验JSON文件: {survey_json_path}")
    except Exception as e:
        logger.error(f"更新测验JSON文件失败: {str(e)}")
        raise