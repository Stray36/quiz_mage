import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getErrorRates, getWordCloud } from '../services/api';
import WordCloudComponent from "../components/WordCloud";

const COLORS = ['#0088FE', '#FF8042']; // 扇形图颜色

export function SpecificHomeworkPage() {
  const { analysisId } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const tno = query.get('tno');

  const [overallRates, setOverAllRates] = useState(null);
  const [questionRates, setQuestionRates] = useState([]);
  const [wordCloudData, setWordCloudData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wordCloudRef = useRef(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getErrorRates(analysisId);
        
        const response = await getWordCloud(analysisId);
        
        console.log(response)

        setOverAllRates(data.error_rate);
        setQuestionRates(data.question_error_rates);
        setWordCloudData(response)
        setLoading(false);
      } catch (err) {
        console.error('数据加载失败:', err);
        setError('无法加载数据，请稍后再试。');
        setLoading(false);
      }
    };

    fetchData();
  }, [analysisId]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>正在加载数据...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        作业分析页面
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        ID: {analysisId}, 教师号: {tno}
      </Typography>

      {/* 扇形图：总体正确率与错误率 */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          总体正确率与错误率
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: '正确率', value: overallRates },
                { name: '错误率', value: 1 - overallRates },
              ]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              <Cell key="correct" fill={COLORS[0]} />
              <Cell key="incorrect" fill={COLORS[1]} />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* 折线图：每道题的正确率 */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          每道题的正确率
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={questionRates}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="question" label={{ value: '题目', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: '正确率 (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="correctRate" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* 词云图 */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <div>
            <Typography variant="h6" gutterBottom>
              词云图
            </Typography>
            <WordCloudComponent data={wordCloudData} />
        </div>
      </Paper>
    </Box>
  );
}