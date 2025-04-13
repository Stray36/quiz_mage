from flask import Flask, request, jsonify, g
from flask_cors import CORS
import logging
import os
import time
from functools import wraps
import json

import config
from quiz_service import generate_quiz, update_survey_json
from file_service import extract_text_from_pdf,generate_pdf_previews
from analysis_service import analyze_quiz_results
# from db_service import init_database, save_quiz, save_analysis, get_quiz_by_id, get_analysis_by_id, get_all_quizzes, get_all_quizzes4teacher, get_all_analyses, get_all_classes, insert_homework
from db_service import *

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


app = Flask(__name__)
CORS(app)
init_database()  # 初始化数据库


from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy
# 初始化配置
config.init_configuration()

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///merged_database.db'


# 初始化扩展
bootstrap = Bootstrap(app)
db = SQLAlchemy(app)

app.secret_key = 'dev'
# 导入视图
from views.login_views import login_bp
from views.student_views import student_bp
from views.teacher_views import teacher_bp

# 注册蓝图
app.register_blueprint(login_bp, url_prefix='/')
app.register_blueprint(student_bp, url_prefix='/student')
app.register_blueprint(teacher_bp, url_prefix='/teacher')

def with_retry(max_retries=3, backoff_factor=0.5, errors=(Exception,)):
    """创建一个带有重试功能的装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except errors as e:
                    retries += 1
                    if retries >= max_retries:
                        app.logger.error(f"函数 {func.__name__} 执行失败，已达到最大重试次数: {e}")
                        raise
                    
                    # 指数退避
                    sleep_time = backoff_factor * (2 ** (retries - 1))
                    app.logger.warning(f"函数 {func.__name__} 失败，{retries}/{max_retries}次尝试。等待{sleep_time:.2f}秒后重试: {e}")
                    time.sleep(sleep_time)
        return wrapper
    return decorator

@app.route('/pdf-preview', methods=['POST'])
def preview_pdf():
    try:
        # 获取上传的文件
        if 'file' not in request.files:
            return jsonify({"error": "未上传文件"}), 400
        
        file = request.files['file']
        if file.filename == '' or not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "未选择PDF文件"}), 400
        
        # 生成预览图
        previews = generate_pdf_previews(file)
        
        # 返回预览数据
        return jsonify({
            "success": True, 
            "previews": previews,
            "totalPages": len(previews)
        }), 200
    except Exception as e:
        logger.error(f"生成PDF预览失败: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/generate-quiz', methods=['POST'])
def create_quiz():
    try:
        sno = request.args.get('sno')  # 从 URL 参数获取 sno
        tno = request.args.get('tno')
        
        # if not sno:
        #     return jsonify({"error": "缺少 sno 参数"}), 400

        if not sno and not tno:
            return jsonify({"error": "缺少 sno/tno 参数"}), 400
        
        #如果是学生自主创建题目
        if not tno:
            tno = 0

        #如果是老师发布题目


        # 获取上传的文件
        if 'file' not in request.files:
            return jsonify({"error": "未上传文件"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "未选择文件"}), 400
        
        # 获取参数
        question_count = int(request.form.get('questionCount', 10))
        difficulty = request.form.get('difficulty', 'medium')
        
        # 获取题目类型
        include_multiple_choice = request.form.get('includeMultipleChoice', 'true').lower() in ('true', '1', 't')
        include_fill_in_blank = request.form.get('includeFillInBlank', 'false').lower() in ('true', '1', 't')
        
        # 如果两种题型都没选，默认选择选择题
        if not include_multiple_choice and not include_fill_in_blank:
            include_multiple_choice = True
        
        # 获取备注信息（可选）
        notes = request.form.get('notes', '')
        
        # 获取选定页面列表
        selected_pages = request.form.get('selectedPages')
        if selected_pages:
            try:
                selected_pages = json.loads(selected_pages)
            except json.JSONDecodeError:
                selected_pages = None
        
        # 提取文本
        if file.filename.lower().endswith('.pdf'):
            content = extract_text_from_pdf(file, selected_pages)
        else:
            content = file.read().decode('utf-8')
        
        # 生成测验题目
        quiz_json = generate_quiz(content, question_count, difficulty, 
                                 include_multiple_choice, include_fill_in_blank, notes)
        
        # 更新前端文件（保留原有功能，但不再是主要方式）
        update_survey_json(quiz_json)
        
        # 保存到数据库
        file_name = file.filename
        title = f"{file_name} - {difficulty}难度 ({question_count}题)"
        quiz_id = save_quiz(tno, sno, title, file_name, quiz_json, question_count, difficulty)
        
        return jsonify({"success": True, "quiz_id": quiz_id}), 200
    except Exception as e:
        logger.error(f"生成测验失败: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/analyze-quiz', methods=['POST'])
@with_retry(max_retries=3, backoff_factor=0.5)
def analyze_quiz():
    try:
        sno = request.args.get('sno')  # 从 URL 参数获取 sno
        tno = request.args.get("tno") 
        
        # 获取用户答案和测验ID
        data = request.json
        if not data or 'answers' not in data:
            return jsonify({"error": "没有提供答案"}), 400
        
        quiz_id = data.get('quiz_id')
        print("quiz_id:", quiz_id)
        # 分析结果
        if quiz_id:
            # 从数据库获取测验
            quiz = get_quiz_by_id(quiz_id)
            if not quiz:
                return jsonify({"error": "测验不存在"}), 404
            result = analyze_quiz_results(data['answers'], quiz['quiz_json'])
            print("result:", result)
        else:
            # 从本地文件分析（兼容旧版本）
            result = analyze_quiz_results(data['answers'])
        
        # 保存分析结果到数据库
        if quiz_id and sno:
            analysis_id = save_analysis(sno, quiz_id, result)
            result["analysis_id"] = analysis_id

        if quiz_id and tno:
            analysis_id = save_teacher_analysis(tno, quiz_id, result)
            result["analysis_id"] = analysis_id
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"测验分析错误: {str(e)}")
        return jsonify({"error": f"测验分析失败: {str(e)}"}), 500


@app.route('/auto_quiz', methods=['GET'])
def get_quizzes_0():
    """获取所有测验"""
    try:        
        sno = request.args.get('sno')  # 从 URL 参数获取 sno
        if not sno:
            return jsonify({"error": "缺少 sno 参数"}), 400

        quizzes = get_all_quizzes0(sno)
        return jsonify(quizzes), 200
    except Exception as e:
        logger.error(f"获取测验列表失败: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/quizzes', methods=['GET'])
def get_quizzes():
    """获取所有作业"""
    try:        
        sno = request.args.get('sno')  # 从 URL 参数获取 sno
        tno = request.args.get('tno')
        # if not sno:
        #     return jsonify({"error": "缺少 sno 参数"}), 400

        if not sno and not tno:
            print("缺少 sno/tno 参数")
            return jsonify({"error": "缺少 sno tno参数"}), 400
        if sno:
            print("sno")
            quizzes = get_all_quizzes(sno)
        else:
            print("tno")
            quizzes = get_all_quizzes4teacher(tno)
            print(quizzes)
        return jsonify(quizzes), 200
    except Exception as e:
        logger.error(f"获取作业列表失败: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/classes', methods=['GET'])
def get_classes():
    """获取所有班级"""
    try:
        tno = request.args.get('tno')  # 从 URL 参数获取 sno
        print("getClasses:", tno)
        if not tno:
            return jsonify({"error": "缺少 sno 参数"}), 400
        classes = get_all_classes(tno)
        print("classes:", classes)
        return jsonify(classes), 200
    except Exception as e:
        logger.error(f"获取班级列表失败: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/quizzes/<int:quiz_id>/publish', methods=['POST'])
def publish_quiz(quiz_id):
    # 获取请求体中的班级编号
    data = request.get_json()
    cno = data.get('cno')
    insert_homework(cno, quiz_id)

    if not cno:
        return jsonify({"error": "缺少 cno 参数"}), 400

    return jsonify({"success": True, "message": "测验发布成功", "quiz_id": quiz_id, "class_id": cno}), 200



@app.route('/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    """获取指定ID的测验"""
    try:
        # print("get_quiz")
        # sno = request.args.get('sno')  # 从 URL 参数获取 sno
        # if not sno:
        #     return jsonify({"error": "缺少 sno 参数"}), 400
        quiz = get_quiz_by_id(quiz_id)
        print(quiz)
        if quiz:
            return jsonify(quiz), 200
        return jsonify({"error": "测验不存在"}), 404
    except Exception as e:
        logger.error(f"获取测验失败1: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/analyses', methods=['GET'])
def get_analyses():
    """
        1.获取学生所有的测验分析 
        2.获取老师已发布作业的分析
    """
    try:        
        sno = request.args.get('sno')  # 从 URL 参数获取 sno
        tno = request.args.get('tno')

        if not sno and not tno:
            print("缺少 sno/tno 参数")
            return jsonify({"error": "缺少 sno tno参数"}), 400
        if sno:
            print("sno")
            quizzes = get_all_analyses(sno)
        else:
            print("tno")
            quizzes = get_teacher_analyses(tno)
            print(quizzes)
        return jsonify(quizzes), 200
    except Exception as e:
        logger.error(f"获取失败: {str(e)}")
        return jsonify({"error": str(e)}), 500


# 获取老师所有的测验分析
@app.route('/teacher_analyses', methods=['GET'])
def get_teacher_all_analyses():
    try:
        tno = request.args.get('tno')
        analyses = get_t_all_analyses(tno)
        return jsonify(analyses), 200
    except Exception as e:
        logger.error(f"获取测验列表失败: {str(e)}")
    return jsonify({"error": str(e)}), 500


@app.route('/analyses/<int:analysis_id>', methods=['GET'])
def get_analysis(analysis_id):
    """获取学生指定ID的分析结果"""
    try:
        sno = request.args.get('sno')  # 从 URL 参数获取 sno
        if not sno:
            return jsonify({"error": "缺少 sno 参数"}), 400
        analysis = get_analysis_by_id(sno, analysis_id)
        if analysis:
            return jsonify(analysis), 200
        return jsonify({"error": "分析结果不存在"}), 404
    except Exception as e:
        logger.error(f"获取分析结果失败: {str(e)}")

        return jsonify({"error": str(e)}), 500


@app.route('/teacher_analyses/<int:analysis_id>', methods=['GET'])
def get_teacher_analysis(analysis_id):
    """获取老师指定ID的分析结果"""
    try:
        tno = request.args.get('tno')  # 从 URL 参数获取 sno
        if not tno:
            return jsonify({"error": "缺少 tno 参数"}), 400
        analysis = get_teacher_analysis_by_id(tno, analysis_id)
        if analysis:
            return jsonify(analysis), 200
        return jsonify({"error": "分析结果不存在"}), 404
    except Exception as e:
        logger.error(f"获取分析结果失败: {str(e)}")

        return jsonify({"error": str(e)}), 500


@app.route('/homework', methods=['GET'])
def get_Homework():
    try:
        tno = request.args.get('tno')
        if not tno:
            return jsonify({"error": "缺少 sno 参数"}), 400
        homeworks = get_homeworks_teacher(tno)
        print(homeworks)
        return jsonify(homeworks), 200
    except Exception as e:
        logger.error(f"获取作业列表失败: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/error-rates/<int:quiz_id>', methods=['GET'])
def get_error_rates(quiz_id):
    try:
        error_rates = get_quiz_error_rates(quiz_id)
        print("error_rates:", error_rates)
        if error_rates:
            return jsonify(error_rates), 200
        return jsonify({"error": "分析结果不存在"}), 404
    except Exception as e:
        logger.error(f"获取分析结果失败: {str(e)}")

        return jsonify({"error": str(e)}), 500


@app.route('/word_cloud/<int:quiz_id>', methods=['GET'])
def get_word_cloud(quiz_id):
    try:
        word_cloud = get_word_frequence_by_qid(quiz_id)
        # print(word_cloud)
        if (word_cloud):
            return jsonify(word_cloud), 200
        return jsonify({"error": "词云分析结果不存在"}), 404
    except Exception as e:
        logger.error(f"获取分析结果失败: {str(e)}")

        return jsonify({"error": str(e)}), 500  


if __name__ == "__main__":
    app.run(debug=True)