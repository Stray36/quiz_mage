import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";

export function SurveyPage() {
  const history = useHistory();
  
  // 页面加载时重定向到测验列表
  useEffect(() => {
    history.push('/survey');
  }, [history]);
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ ml: 2 }}>正在加载测验列表...</Typography>
    </Box>
  );
}
