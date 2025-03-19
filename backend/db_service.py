import sqlite3
import json
import time
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

DB_FILE = "quiz.db"

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
        
        # 创建quiz表，存储测验题目
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            file_name TEXT,
            quiz_json TEXT NOT NULL,
            question_count INTEGER,
            difficulty TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # 创建analysis表，存储分析结果
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER,
            analysis_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
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

def save_quiz(title, file_name, quiz_json, question_count, difficulty):
    """保存测验题目到数据库"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO quizzes (title, file_name, quiz_json, question_count, difficulty)
        VALUES (?, ?, ?, ?, ?)
        ''', (title, file_name, json.dumps(quiz_json), question_count, difficulty))
        
        quiz_id = cursor.lastrowid
        conn.commit()
        logger.info(f"测验保存成功，ID: {quiz_id}")
        return quiz_id
    except Exception as e:
        logger.error(f"保存测验失败: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

def save_analysis(quiz_id, analysis_json):
    """保存分析结果到数据库"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO analysis_results (quiz_id, analysis_json)
        VALUES (?, ?)
        ''', (quiz_id, json.dumps(analysis_json)))
        
        analysis_id = cursor.lastrowid
        conn.commit()
        logger.info(f"分析结果保存成功，ID: {analysis_id}")
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
        ''', (quiz_id,))
        
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

def get_analysis_by_id(analysis_id):
    """根据ID获取分析结果"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM analysis_results WHERE id = ?
        ''', (analysis_id,))
        
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

def get_analysis_by_quiz_id(quiz_id):
    """根据测验ID获取分析结果"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM analysis_results WHERE quiz_id = ?
        ORDER BY created_at DESC
        ''', (quiz_id,))
        
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

def get_all_quizzes():
    """获取所有测验"""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, title, file_name, question_count, difficulty, created_at
        FROM quizzes
        ORDER BY created_at DESC
        ''')
        
        rows = cursor.fetchall()
        quizzes = [dict(row) for row in rows]
        return quizzes
    except Exception as e:
        logger.error(f"获取所有测验失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

def get_all_analyses():
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
        ORDER BY ar.created_at DESC
        ''')
        
        rows = cursor.fetchall()
        analyses = [dict(row) for row in rows]
        return analyses
    except Exception as e:
        logger.error(f"获取所有分析结果失败: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()