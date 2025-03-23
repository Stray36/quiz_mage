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
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getQuizzes } from '../services/api';
import { format } from 'date-fns';

const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

export function QuizHistoryPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

    fetchQuizzes();
  }, []);

  const handleStartQuiz = (quizId) => {
    let sno = getQueryParam('sno'); // 尝试从 URL 获取学号
    console.log("sno:", sno, typeof sno); // 这里检查 sno 是否是字符串
    history.push(`/survey/${quizId}?sno=${sno}`);
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
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                          <FolderIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            课程名: {quiz.cname}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            测验ID: {quiz.id}
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