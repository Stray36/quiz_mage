import os
import json
import logging
import httpx
from dotenv import load_dotenv
import google.generativeai as genai

# 全局变量
model = None
logger = logging.getLogger(__name__)

def init_configuration():
    """初始化所有配置"""
    global model
    
    # 配置代理
    setup_proxy()
    
    # 加载环境变量
    load_dotenv()
    
    try:
        # 配置 Gemini API
        api_key = os.getenv('API_KEY')
        model_name = os.getenv('MODEL')
        example_json = os.getenv('EXAMPLE_JSON')
        api_url = os.getenv('API_URL')
        
        if not all([api_key, model_name, example_json, api_url]):
            raise ValueError("环境变量未正确加载")
        
        # 配置请求头
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        }
        
        # 测试网络连接
        test_connection(api_url, headers)
        
        # 尝试解析 EXAMPLE_JSON
        try:
            json.loads(example_json)
        except json.JSONDecodeError as e:
            logger.error(f"解析 EXAMPLE_JSON 失败: {str(e)}")
            raise
        
        # 配置 Gemini
        genai.configure(
            api_key=api_key,
            transport='rest'
        )
        
        # 验证模型是否可用
        try:
            model = genai.GenerativeModel(model_name)
            # 发送一个简单的测试请求
            response = model.generate_content("test")
            logger.info("Gemini API 配置成功")
        except Exception as e:
            logger.error(f"Gemini API 配置失败: {str(e)}")
            raise
        
    except Exception as e:
        logger.error(f"初始化失败: {str(e)}", exc_info=True)
        raise
def setup_proxy():
    """设置网络代理"""
    # 只在非生产环境使用代理
    if os.getenv('ENVIRONMENT') != 'production':
        os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:7890'
        os.environ['HTTP_PROXY'] = 'http://127.0.0.1:7890'
    
    # 配置 httpx 客户端超时
    timeout = httpx.Timeout(30.0, connect=20.0)
    return httpx.Client(timeout=timeout)

def test_connection(api_url, headers):
    """测试API连接"""
    client = setup_proxy()
    try:
        test_url = f"{api_url}/models"
        logger.debug(f"正在测试API连接: {test_url}")
        response = client.get(test_url, headers=headers)
        
        if response.status_code == 200:
            logger.info("API 连接测试成功")
            logger.debug(f"API 响应: {response.text}")
        else:
            logger.error(f"API 连接测试失败: HTTP {response.status_code}")
            logger.error(f"响应内容: {response.text}")
            raise ValueError(f"API 连接测试失败: HTTP {response.status_code}")
    except Exception as e:
        logger.error(f"API 连接测试失败: {str(e)}")
        logger.error("请检查网络连接、代理设置和API密钥")
        raise

def get_model():
    """获取AI模型实例"""
    global model
    return model