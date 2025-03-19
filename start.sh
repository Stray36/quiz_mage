#!/bin/bash

# 定义前后端目录
FRONTEND_DIR="D:\大三下\软件工程\auto_quiz1\frontend"
BACKEND_DIR="D:\大三下\软件工程\auto_quiz1\backend"

# 启动前端
echo "启动前端..."
osascript -e "tell application \"Terminal\" to do script \"cd $FRONTEND_DIR && npm start\""

# 启动后端
echo "启动后端..."
osascript -e "tell application \"Terminal\" to do script \"cd $BACKEND_DIR && python app.py\""

# 等待几秒钟以确保服务启动
sleep 5

# 如果需要检查进程是否成功运行，你可以使用类似的方法：
# # 检查前端是否运行
# if ps -p $(pgrep -f "npm start") > /dev/null
# then
#    echo "前端运行中"
# else
#    echo "前端启动失败"
#    exit 1
# fi

# # 检查后端是否运行
# if ps -p $(pgrep -f "python3 app.py") > /dev/null
# then
#    echo "后端运行中"
# else
#    echo "后端启动失败"
#    exit 1
# fi

# 等待前后端进程结束
wait