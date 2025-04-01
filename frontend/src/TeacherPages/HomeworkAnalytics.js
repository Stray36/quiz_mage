import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useParams, useLocation } from 'react-router-dom';
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
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getHomework } from '../services/api';
import { format } from 'date-fns';

const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

export function HomeworkPage() {
  const [homework, setHomework] = useState([]);
  const [errorRates, setErrorRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const history = useHistory();

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const data = await getHomework();
        setHomework(data);
        setLoading(false);
      } catch (error) {
        console.error("获取分析历史失败:", error);
        setError("无法加载分析历史。请稍后再试或联系管理员。");
        setLoading(false);
      }
    };

    fetchHomework();
  }, []);

  const handleViewAnalysis1 = (analysisId) => {
    let tno = getQueryParam('tno'); 
    history.push(`/HWanalytics/${analysisId}?tno=${tno}`); 
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>正在加载作业分析历史...</Typography>
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
        学生作业分析
      </Typography>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {homework.length > 0 ? (
          <List>
            {homework.map((homework, index) => (
              <React.Fragment key={homework.id}>
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
                          {homework.cname}
                        </Typography>
                        <Tooltip title="查看分析">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleViewAnalysis1(homework.qid)}
                            sx={{ 
                              bgcolor: 'primary.light', 
                              color: 'white',
                              '&:hover': { bgcolor: 'primary.main' } 
                            }}
                          >
                            <AssessmentIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                          <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            作业名称: {homework.title}
                          </Typography>
                        </Box>
                        {}
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label="分析报告" 
                            size="small" 
                            color="secondary" 
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
              暂无分析历史
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              您还没有完成任何测验分析。点击下方按钮创建一个新的测验。
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