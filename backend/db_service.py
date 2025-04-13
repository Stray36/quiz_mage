import sqlite3
import json
import time
import logging
import os
import jieba
from collections import Counter
from pathlib import Path

logger = logging.getLogger(__name__)

DB_FILE = "merged_database.db"

with open('stop_words.txt', 'r', encoding='utf-8') as f:
    STOP_WORDS = {line.strip() for line in f if line.strip()}

def init_database():
    """初始化数据库，创建必要的表"""
    conn = None
    try:
        # 确保数据库目录存在
        db_path = Path(DB_FILE)
        if not db_path.parent.exists():
            db_path.parent.mkdir(parents=True)

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # 创建 quizzes 表，存储测验题目，并添加 sno
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sno TEXT NOT NULL,  -- 存储学号，确保不同用户的数据分开
            tno TEXT NOT NULL,  -- 存储老师号，确保不同用户的数据分开
            title TEXT NOT NULL,
            file_name TEXT,
            quiz_json TEXT NOT NULL,
            question_count INTEGER,
            difficulty TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # 创建 analysis_results 表，存储分析结果，并添加 sno
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sno TEXT NOT NULL,  -- 存储学号，确保分析数据与用户绑定
            quiz_id INTEGER,
            analysis_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        )
        ''')

        conn.commit()
        logger.info("数据库初始化成功")
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


def save_quiz(tno, sno, title, file_name, quiz_json, question_count, difficulty):
    """保存测验题目到数据库，并绑定学号 sno"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO quizzes (tno, sno, title, file_name, quiz_json, question_count, difficulty)
        VALUES (?, ?, ?, ?, ?, ?,?)
        ''', (tno, sno, title, file_name, json.dumps(quiz_json), question_count, difficulty))
        
        quiz_id = cursor.lastrowid
        conn.commit()
        logger.info(f"测验保存成功，ID: {quiz_id}，教师号：{tno}，学号: {sno}")
        return quiz_id
    except Exception as e:
        logger.error(f"保存测验失败: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


def save_analysis(sno, quiz_id, analysis_json):
    """保存学生分析结果到数据库，并绑定学号 sno"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO analysis_results (sno, quiz_id, analysis_json)
        VALUES (?, ?, ?)
        ''', (sno, quiz_id, json.dumps(analysis_json)))
        
        analysis_id = cursor.lastrowid
        conn.commit()
        logger.info(f"分析结果保存成功，ID: {analysis_id}，学号: {sno}")
        return analysis_id
    except Exception as e:
        logger.error(f"保存分析结果失败: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

def save_teacher_analysis(tno, quiz_id, analysis_json):
    """保存教师分析结果到数据库，并绑定tno"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO analysis_results (tno, quiz_id, analysis_json, sno)
        VALUES (?, ?, ?, ?)
        ''', (tno, quiz_id, json.dumps(analysis_json), None))
        
        analysis_id = cursor.lastrowid
        conn.commit()
        logger.info(f"分析结果保存成功，ID: {analysis_id}，教师号: {tno}")
        return analysis_id
    except Exception as e:
        logger.error(f"保存分析结果失败: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

def get_quiz_by_id(quiz_id):
    """根据ID获取测验题目"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM quizzes WHERE id = ? 
        ''', (quiz_id, ))
        
        row = cursor.fetchone()
        if row:
            quiz = dict(row)
            print(quiz)
            quiz['quiz_json'] = json.loads(quiz['quiz_json'])
            return quiz
        return None
    except Exception as e:
        logger.error(f"获取测验失败2: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

def get_analysis_by_id(sno, analysis_id):
    """根据学生ID获取分析结果"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM analysis_results WHERE id = ? AND sno = ?
        ''', (analysis_id, sno))
        
        row = cursor.fetchone()
        if row:
            analysis = dict(row)
            analysis['analysis_json'] = json.loads(analysis['analysis_json'])
            return analysis
        return None
    except Exception as e:
        logger.error(f"获取分析结果失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()


def get_teacher_analysis_by_id(tno, analysis_id):
    """根据老师ID获取分析结果"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM analysis_results WHERE id = ? AND tno = ?
        ''', (analysis_id, tno))
        
        row = cursor.fetchone()
        if row:
            analysis = dict(row)
            analysis['analysis_json'] = json.loads(analysis['analysis_json'])
            print()
            return analysis
        return None
    except Exception as e:
        logger.error(f"获取分析结果失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()


def get_analysis_by_quiz_id(sno, quiz_id):
    """根据测验ID获取分析结果"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM analysis_results WHERE quiz_id = ? AND sno = ?
        ORDER BY created_at DESC
        ''', (quiz_id, sno))
        
        rows = cursor.fetchall()
        analyses = []
        for row in rows:
            analysis = dict(row)
            analysis['analysis_json'] = json.loads(analysis['analysis_json'])
            analyses.append(analysis)
        return analyses
    except Exception as e:
        logger.error(f"获取分析结果失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

# 获取所有测验
def get_all_quizzes0(sno):
    """获取所有测验"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, title, file_name, question_count, difficulty, created_at
        FROM quizzes
        WHERE sno = ?
        ORDER BY created_at DESC
        ''', (sno,))
        
        rows = cursor.fetchall()
        quizzes = [dict(row) for row in rows]
        return quizzes
    except Exception as e:
        logger.error(f"获取所有测验失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

# 获取所有作业
def get_all_quizzes(sno):
    conn = None
    try:
        # 连接数据库
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Step 1: 根据 sno 查询 student_course 表中的 cno
        cursor.execute('''
        SELECT DISTINCT cno 
        FROM student_course 
        WHERE sno = ?
        ''', (sno,))
        courses = cursor.fetchall()

        if not courses:
            logger.warning(f"学生号 {sno} 没有注册任何课程")
            return []

        # Step 2: 遍历每门课程，获取 course 表中的 cname 和 homework 表中的 qid
        quizzes_with_info = []
        for course in courses:
            cno = course['cno']

            # 获取课程名称 cname
            cursor.execute('''
            SELECT cname 
            FROM course 
            WHERE cno = ?
            ''', (cno,))
            course_info = cursor.fetchone()
            if not course_info:
                logger.warning(f"课程编号 {cno} 不存在对应的课程名称")
                continue

            cname = course_info['cname']

            # 获取 homework 表中的 qid
            cursor.execute('''
            SELECT DISTINCT qid 
            FROM homework 
            WHERE cno = ?
            ''', (cno,))
            quizids = cursor.fetchall()

            if not quizids:
                logger.warning(f"课程 {cno} 没有相关的测验")
                continue

            # Step 3: 根据 qid 查询 quizzes 表中的测验信息
            for quiz in quizids:
                qid = quiz['qid']
                cursor.execute('''
                SELECT id, title, file_name, question_count, difficulty, created_at
                FROM quizzes
                WHERE id = ?
                ''', (qid,))
                quiz_row = cursor.fetchone()

                if not quiz_row:
                    logger.warning(f"测验编号 {qid} 不存在对应的测验信息")
                    continue

                # 将结果添加到返回列表中
                quizzes_with_info.append({
                    "id": quiz_row['id'],
                    "title": quiz_row['title'],
                    "file_name": quiz_row['file_name'],
                    "question_count": quiz_row['question_count'],
                    "difficulty": quiz_row['difficulty'],
                    "created_at": quiz_row['created_at'],
                    "cname": cname,
                    "cno": cno
                })

        return quizzes_with_info

    except Exception as e:
        logger.error(f"获取所有作业失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

def get_all_quizzes4teacher(tno):
    """获取老师发布的所有测验"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, title, file_name, question_count, difficulty, created_at
        FROM quizzes
        WHERE tno = ?
        ORDER BY created_at DESC
        ''', (tno,))
        
        rows = cursor.fetchall()
        quizzes = [dict(row) for row in rows]
        return quizzes
    except Exception as e:
        logger.error(f"获取所有测验失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()


# 获取老师的所有测验分析
def get_t_all_analyses(tno):
    """获取所有分析结果"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT ar.id, ar.quiz_id, ar.created_at, 
               q.title AS quiz_title, q.file_name
        FROM analysis_results ar
        JOIN quizzes q ON ar.quiz_id = q.id
        WHERE ar.tno = ?
        ORDER BY ar.created_at DESC
        ''', (tno,))
        
        rows = cursor.fetchall()
        analyses = [dict(row) for row in rows]
        return analyses
    except Exception as e:
        logger.error(f"获取所有分析结果失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()


def get_all_analyses(sno):
    """获取所有分析结果"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT ar.id, ar.quiz_id, ar.created_at, 
               q.title AS quiz_title, q.file_name
        FROM analysis_results ar
        JOIN quizzes q ON ar.quiz_id = q.id
        WHERE ar.sno = ?
        ORDER BY ar.created_at DESC
        ''', (sno,))
        
        rows = cursor.fetchall()
        analyses = [dict(row) for row in rows]
        return analyses
    except Exception as e:
        logger.error(f"获取所有分析结果失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

def get_teacher_analyses(tno):
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT ar.id, ar.quiz_id, ar.created_at, 
               q.title AS quiz_title, q.file_name
        FROM analysis_results ar
        JOIN quizzes q ON ar.quiz_id = q.id
        WHERE ar.tno = ?
        ORDER BY ar.created_at DESC
        ''', (tno,))
        
        rows = cursor.fetchall()
        analyses = [dict(row) for row in rows]
        return analyses
    except Exception as e:
        logger.error(f"获取所有分析结果失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()
            
def get_all_classes(tno):
    try:
        # 连接数据库
        with sqlite3.connect(DB_FILE) as conn:
            conn.row_factory = sqlite3.Row  # 使用字典形式访问行
            cursor = conn.cursor()

            # 执行查询
            cursor.execute('''
                SELECT cno, cname 
                FROM course 
                WHERE tno = ?
            ''', (tno,))
            courses = cursor.fetchall()

            # 提取 {cno: cname} 字典
            course_dict = [dict(course) for course in courses]

            if not course_dict:
                logger.warning(f"教师号 {tno} 没有教授任何课程")
            
            return course_dict

    except Exception as e:
        logger.error(f"查询失败: {str(e)}")
        raise
  
def insert_homework(cno, qid):
    try:
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()

            # 执行插入操作
            cursor.execute('''
                INSERT INTO homework (cno, qid)
                VALUES (?, ?)
            ''', (cno, qid))

            # 获取新插入记录的主键 ID
            new_id = cursor.lastrowid

            # 提交事务
            conn.commit()

            logger.info(f"成功插入 homework 记录: cno={cno}, qid={qid}, id={new_id}")
            return new_id

    except Exception as e:
        logger.error(f"插入 homework 数据失败: {str(e)}")
        raise

def get_course_quiz_error_rates(tno):
    """
    统计某一门课程不同 quizid 的总体错误率和单道题目错误率。
    """
    conn = None
    try:
        # 连接数据库
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row  # 使用字典形式访问行
        cursor = conn.cursor()

        # Step 1: 根据 tno 查询教师教授的课程 cno
        cursor.execute('''
        SELECT cno 
        FROM course 
        WHERE tno = ?
        ''', (tno,))
        courses = cursor.fetchall()

        if not courses:
            logger.warning(f"教师号 {tno} 没有教授任何课程")
            return []

        # Step 2: 遍历每门课程，获取相关 quizid
        result = []
        for course in courses:
            cno = course['cno']

            # 根据 cno 查询 homework 表中的 quizid
            cursor.execute('''
            SELECT DISTINCT qid 
            FROM homework 
            WHERE cno = ?
            ''', (cno,))
            quizids = cursor.fetchall()

            if not quizids:
                logger.warning(f"课程 {cno} 没有相关的测验")
                continue

            # Step 3: 遍历每个 quizid，计算错误率
            for quiz in quizids:
                qid = quiz['qid']

                # 根据 quizid 查询 analysis_results 表中的 analysis_json
                cursor.execute('''
                SELECT analysis_json 
                FROM analysis_results 
                WHERE quiz_id = ?
                ''', (qid,))
                analyses = cursor.fetchall()

                total_questions = 0
                incorrect_count = 0
                question_errors = {}  # 记录每道题的错误次数

                for analysis in analyses:
                    analysis_data = json.loads(analysis['analysis_json'])
                    total_questions = max(total_questions, analysis_data.get("totalQuestions", 0))
                    incorrect_count += analysis_data.get("incorrectCount", 0)

                    # 解析 errorIndex 字段
                    error_index = analysis_data.get("errorIndex", "")
                    for i, char in enumerate(error_index):
                        if char == '1':  # 如果该位为 '1'，表示该题错误
                            question_number = i + 1  # 题目编号从 1 开始
                            question_errors[question_number] = question_errors.get(question_number, 0) + 1

                # 计算总体错误率
                error_rate = 0
                if total_questions > 0:
                    error_rate = incorrect_count / total_questions

                # 计算每道题的错误率
                question_error_rates = {}
                for question_number, error_count in question_errors.items():
                    question_error_rates[question_number] = error_count / len(analyses)

                # 添加到结果列表
                result.append({
                    "courseid": cno,
                    "quizid": qid,
                    "error_rate": error_rate,
                    "question_error_rates": question_error_rates
                })

        return result

    except Exception as e:
        logger.error(f"统计错误率失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

def get_homeworks_teacher(tno):
    try:
        # 连接数据库
        with sqlite3.connect(DB_FILE) as conn:
            conn.row_factory = sqlite3.Row  # 使用字典形式访问行
            cursor = conn.cursor()

            # 执行查询，获取课程编号、课程名和测验编号
            cursor.execute('''
                SELECT h.cno, c.cname, h.qid, q.title 
                FROM homework h
                JOIN course c ON h.cno = c.cno
                JOIN quizzes q ON h.qid = q.id
                WHERE c.tno = ?
            ''', (tno,))
            homeworks = cursor.fetchall()

            # 提取 {cno, cname, qid} 字典
            homework_list = [dict(homework) for homework in homeworks]

            if not homework_list:
                logger.warning(f"教师号 {tno} 没有布置任何作业")
            
            return homework_list

    except Exception as e:
        logger.error(f"查询失败: {str(e)}")
        raise

def get_quiz_error_rates(quizid):
    """
    统计某一测验的总体错误率和单道题目错误率。
    
    参数:
        quizid (str): 测验编号
    
    返回:
        dict: 包含 {error_rate, question_error_rates} 的字典
              其中 question_error_rates 是一个字典，键为题目编号（从 1 开始），值为该题目的错误率
    """
    conn = None
    try:
        # 连接数据库
        conn = sqlite3.connect(DB_FILE)  # 替换为你的数据库文件路径
        conn.row_factory = sqlite3.Row  # 使用字典形式访问行
        cursor = conn.cursor()

        # Step 1: 根据 quizid 查询 analysis_results 表中的 analysis_json
        cursor.execute('''
        SELECT analysis_json 
        FROM analysis_results 
        WHERE quiz_id = ?
        ''', (quizid,))
        analyses = cursor.fetchall()

        if not analyses:
            raise ValueError(f"测验编号 {quizid} 没有分析数据")

        # Step 2: 解析 analysis_json 数据
        total_questions = 0
        incorrect_count = 0
        question_errors = {}  # 记录每道题的错误次数

        for analysis in analyses:
            analysis_data = json.loads(analysis['analysis_json'])
            total_questions = max(total_questions, analysis_data.get("totalQuestions", 0))
            incorrect_count += analysis_data.get("incorrectCount", 0)

            # 解析 errorIndex 字段
            error_index = analysis_data.get("errorIndex", "")
            for i, char in enumerate(error_index):
                if char == '1':  # 如果该位为 '1'，表示该题错误
                    question_number = i + 1  # 题目编号从 1 开始
                    question_errors[question_number] = question_errors.get(question_number, 0) + 1

        # Step 3: 计算总体错误率
        error_rate = 0
        if total_questions > 0:
            error_rate = incorrect_count / total_questions

        # Step 4: 计算每道题的错误率并按题目编号排序
        question_error_rates = []
        for question_number in sorted(question_errors.keys()):  # 按题目编号排序
            error_count = question_errors[question_number]
            correct_rate = 1 - (error_count / len(analyses))  # 正确率 = 1 - 错误率
            question_error_rates.append({
                "question": str(question_number),  # 转为字符串以适配前端需求
                "correctRate": correct_rate
            })

        # 返回结果
        return {
            "error_rate": error_rate / total_questions,
            "question_error_rates": question_error_rates
        }

    except Exception as e:
        print(f"统计错误率失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

def get_word_frequence_by_qid(qid):
    """
    获取指定测验的所有 knowledgeAnalysis 词频，用于制作词云图
    """
    conn = None
    try:
        # 连接数据库
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row  # 使用字典形式访问行
        cursor = conn.cursor()

        # Step 1: 查询analysis_json
        cursor.execute('''
        SELECT analysis_json 
        FROM analysis_results 
        WHERE quiz_id = ?
        ''', (qid,))
        analyses = cursor.fetchall()

        if not analyses:
            raise ValueError(f"测验编号 {qid} 没有分析数据")

        # Step 2: 提取所有knowledgeAnalysis内容
        all_texts = []
        for analysis in analyses:
            analysis_data = json.loads(analysis['analysis_json'])
            if knowledge_analysis := analysis_data.get("knowledgeAnalysis", ""):
                all_texts.append(knowledge_analysis)

        # Step 3: 文本处理和分词
        combined_text = " ".join(all_texts)
        words = [
            word for word in jieba.lcut(combined_text)
            if word.strip() and word not in STOP_WORDS
        ]

        # Step 4: 统计词频并取Top30
        word_counts = Counter(words)
        top20 = word_counts.most_common(40)

        # 转换为词云格式
        return [{"text": word, "value": freq} for word, freq in top20]

    except Exception as e:
        print(f"获取词频失败: qid={qid}, error={str(e)}")
        raise
    finally:
        if conn:
            conn.close()