import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//import { getErrorRates } from '../services/api';

export function SpecificHomeworkPage() {
  const { analysisId } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const tno = query.get('tno');
  console.log(tno); // 检查是否正确解析参数

  console.log('analysisId:', analysisId, 'tno:', tno); // 检查是否正确解析参数

  return (
    <div>
      <h1>作业分析页面</h1>
      <p>Analysis ID: {analysisId}</p>
      <p>Teacher Number: {tno}</p>
    </div>
  );
}