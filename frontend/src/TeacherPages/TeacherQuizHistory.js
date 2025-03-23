import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getQuizzes, getClasses, publishQuiz } from '../services/api';
import { format } from 'date-fns';


const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

export function TeacherQuizHistoryPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizClassSelections, setQuizClassSelections] = useState({}); // 存储每个测验的班级选择
  const [classes, setClasses] = useState([]); // 班级列表
  const history = useHistory();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await getQuizzes();
        setQuizzes(data);
        setLoading(false);
      } catch (error) {
        console.error("获取测验历史失败:", error);
        setError("无法加载测验历史。请稍后再试或联系管理员。");
        setLoading(false);
      }
    };

    const fetchClasses = async () => {
      try {
        const data = await getClasses(); // 假设后端提供此 API
        console.log("获取班级列表成功:", data);
        setClasses(data); // 假设返回的班级数据是 { classes: [...] }
      } catch (error) {
        console.error("获取班级列表失败:", error);
      }
    };

    fetchQuizzes();
    fetchClasses();
  }, []);

  const handleStartQuiz = (quizId) => {
    let tno = getQueryParam('tno'); // 尝试从 URL 获取学号
    console.log("tno:", tno, typeof tno); // 这里检查 tno 是否是字符串
    history.push(`/survey/${quizId}?tno=${tno}`);
    // history.push(`/survey/${quizId}`);
  };

  const handlePublishQuiz = async (quizId, cno) => {
    if (!cno) {
      alert("请选择一个班级后再发布测验！");
      return;
    }
      const response = await publishQuiz(quizId, cno);
      console.log("发布测验成功:", response);
      alert(`测验发布成功！班级编号: ${cno}`);
  };


  // 格式化日期
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // 获取难度对应的颜色
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>正在加载测验历史...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Typography variant="h4" component="h1" align="center" sx={{ mb: 4 }}>
        测验历史
      </Typography>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {quizzes.length > 0 ? (
          <List>
            {quizzes.map((quiz, index) => (
              <React.Fragment key={quiz.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ 
                    py: 2,
                    ':hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">
                          {quiz.title}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <Tooltip title="开始测验">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleStartQuiz(quiz.id)}
                            sx={{ 
                              bgcolor: 'primary.light', 
                              color: 'white',
                              '&:hover': { bgcolor: 'primary.main' }
                            }}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>

                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                          <FolderIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            文件名: {quiz.file_name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            创建时间: {formatDate(quiz.created_at)}
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={`${quiz.question_count}题`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Chip 
                            label={quiz.difficulty === 'easy' ? '简单' : quiz.difficulty === 'medium' ? '中等' : '困难'} 
                            size="small" 
                            color={getDifficultyColor(quiz.difficulty)}
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>

                        <FormControl fullWidth size="small" sx={{ mt: 2, width: '25%' }}>
                          <InputLabel>选择班级</InputLabel>
                          <Select
                            value={quizClassSelections[quiz.id] || ""} // 获取当前测验的班级选择
                            onChange={(e) => {
                              setQuizClassSelections({
                                ...quizClassSelections,
                                [quiz.id]: e.target.value, // 更新当前测验的班级选择
                              });
                            }}
                            label="选择班级"
                          >
                            {classes.map((classItem) => (
                              <MenuItem key={classItem.cno} value={classItem.cno}>
                                {classItem.cname}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            size="small" 
                            sx={{ ml: 80 }} // 添加左侧间距
                            onClick={() => handlePublishQuiz(quiz.id, quizClassSelections[quiz.id])} // 发布测验的处理函数
                        >
                            发布
                        </Button>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              暂无测验历史
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              您还没有生成任何测验。点击下方按钮创建一个新的测验。
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => history.push('/')}
            >
              创建测验
            </Button>
          </Box>
          
        )}
      </Paper>
    </Box>
  );
}