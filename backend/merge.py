import sqlite3

def merge_databases(source_db1, source_db2, target_db):
    """
    合并两个 SQLite 数据库到一个新的数据库中
    Args:
        source_db1: 第一个源数据库文件路径 (quiz.db)
        source_db2: 第二个源数据库文件路径 (database.db)
        target_db: 目标数据库文件路径
    """
    try:
        # 连接目标数据库
        target_conn = sqlite3.connect(target_db)
        target_cursor = target_conn.cursor()

        # 附加第一个源数据库
        target_cursor.execute(f"ATTACH DATABASE '{source_db1}' AS db1")
        # 附加第二个源数据库
        target_cursor.execute(f"ATTACH DATABASE '{source_db2}' AS db2")

        # 将 db1 的表和数据复制到目标数据库
        tables_db1 = target_cursor.execute("SELECT name, sql FROM db1.sqlite_master WHERE type='table'").fetchall()
        for table_name, create_table_sql in tables_db1:
            if table_name == "sqlite_sequence":  # 跳过内部表
                continue

            # 检查目标数据库中是否已存在表
            existing_tables = target_cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
            existing_tables = [t[0] for t in existing_tables]

            if table_name not in existing_tables:
                # 创建表（使用原始的 CREATE TABLE 语句）
                target_cursor.execute(create_table_sql)

            # 插入数据
            target_cursor.execute(f"INSERT INTO {table_name} SELECT * FROM db1.{table_name}")

        # 将 db2 的表和数据复制到目标数据库
        tables_db2 = target_cursor.execute("SELECT name, sql FROM db2.sqlite_master WHERE type='table'").fetchall()
        for table_name, create_table_sql in tables_db2:
            if table_name == "sqlite_sequence":  # 跳过内部表
                continue

            if table_name not in existing_tables:
                # 创建表（使用原始的 CREATE TABLE 语句）
                target_cursor.execute(create_table_sql)

            # 插入数据
            target_cursor.execute(f"INSERT INTO {table_name} SELECT * FROM db2.{table_name}")

        target_conn.commit()
        print(f"成功将 {source_db1} 和 {source_db2} 合并到 {target_db}")
    except Exception as e:
        print(f"合并数据库失败: {str(e)}")
    finally:
        target_conn.close()

# 调用合并函数
merge_databases("quiz.db", "database.db", "merged_database.db")