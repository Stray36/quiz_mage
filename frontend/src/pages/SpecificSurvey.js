// frontend/src/pages/SpecificSurvey.js
import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Model, StylesManager } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.css";
import { Box, Typography, Paper, LinearProgress, Snackbar, Alert, CircularProgress, Button } from "@mui/material";
import "../styles/survey-mui-integration.css";
import { getQuizById, analyzeQuiz } from "../services/api";

StylesManager.applyTheme("defaultV2");

function onValueChanged(_, options) {
  console.log("New value: " + options.value);
}

const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

export function SpecificSurveyPage() {
  const { quizId } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [quizData, setQuizData] = useState(null);
  
  // 加载测验数据
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await getQuizById(quizId);
        setQuizData(data);
        setLoading(false);
      } catch (error) {
        console.error("获取测验失败:", error);
        setError("无法加载测验数据。请稍后再试或返回测验列表。");
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);
  
  // 提交进度条动画
  useEffect(() => {
    let timer = null;
    
    if (submitting && progress < 90) {
      timer = setInterval(() => {
        setProgress((prevProgress) => prevProgress >= 90 ? 90 : prevProgress + 10);
      }, 500);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submitting, progress]);
  
  async function onComplete(survey) {
    console.log("Survey complete! Results: " + JSON.stringify(survey.data));
    setSubmitting(true);
    
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let success = false;
    
    while (retryCount < MAX_RETRIES && !success) {
      try {
        // 显示重试信息（如果不是第一次尝试）
        if (retryCount > 0) {
          console.log(`提交答案重试第 ${retryCount} 次...`);
          setError(`提交答案重试第 ${retryCount} 次...`);
        }
        
        // 发送答案到后端进行分析
        const result = await analyzeQuiz(survey.data, quizId);
        
        // 标记成功
        success = true;
        setProgress(100);
        
        // 延迟跳转，给用户足够时间阅读完成信息
        setTimeout(() => {
          let sno = getQueryParam('sno'); // 尝试从 URL 获取学号
          // 跳转到特定分析页面
          history.push(`/analytics/${result.analysis_id}?sno=${sno}`);
        }, 3000); // 3秒后跳转
        
      } catch (error) {
        retryCount++;
        console.error(`提交答案失败 (尝试 ${retryCount}/${MAX_RETRIES}):`, error);
        setError(`提交答案失败 (尝试 ${retryCount}/${MAX_RETRIES}): ${error.message}`);
        
        if (retryCount >= MAX_RETRIES) {
          console.error("已达到最大重试次数");
          setError(`提交答案失败，已尝试 ${MAX_RETRIES} 次。请检查网络连接或稍后再试。`);
          setSubmitting(false);
        } else {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // 随着重试次数增加等待时间
        }
      }
    }
  }

  const handleCloseError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>正在加载测验...</Typography>
      </Box>
    );
  }

  if (error && !submitting) {
    return (
      <Alert severity="error" sx={{ mt: 4 }} action={
        <Button color="inherit" onClick={() => history.push('/survey')}>
          返回测验列表
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  const model = new Model(quizData.quiz_json);
  model.showCompletedPage = false; // 避免显示默认的完成页面
  
  // 自定义响应式CSS样式
  const surveyContainerStyles = {
    maxWidth: '800px', 
    margin: '0 auto', 
    padding: '20px'
  };

  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        {quizData.title}
      </Typography>
      
      {submitting && (
        <Paper elevation={3} sx={{ p: 3, mt: 2, mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {progress === 100 ? "提交成功！正在准备分析报告..." : "正在提交您的答案..."}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 10, borderRadius: 5, mt: 2, mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {progress === 100 ? "几秒后将自动跳转到分析页面" : `处理中 ${progress}%`}
          </Typography>
        </Paper>
      )}
      
      {!submitting && (
        <Paper elevation={3} sx={surveyContainerStyles}>
          <Survey
            model={model}
            onComplete={onComplete}
            onValueChanged={onValueChanged}
          />
        </Paper>
      )}
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}