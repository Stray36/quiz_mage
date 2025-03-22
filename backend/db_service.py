import sqlite3
import json
import time
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

DB_FILE = "merged_database.db"

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
        VALUES (?, ?, ?, ?, ?, ?)
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
    """保存分析结果到数据库，并绑定学号 sno"""
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


def get_quiz_by_id(sno, quiz_id):
    """根据ID获取测验题目"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM quizzes WHERE id = ? AND sno = ?
        ''', (quiz_id, sno))
        
        row = cursor.fetchone()
        if row:
            quiz = dict(row)
            quiz['quiz_json'] = json.loads(quiz['quiz_json'])
            return quiz
        return None
    except Exception as e:
        logger.error(f"获取测验失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

def get_analysis_by_id(sno, analysis_id):
    """根据ID获取分析结果"""
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

def get_all_quizzes(sno):
    """获取所有测验"""
    print("get_all_quizzes")
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

def get_all_quizzes4teacher(tno):
    """获取所有测验"""
    print("get_all_quizzes4teacher")
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