import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时
});

// 从 URL 获取查询参数
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

// 获取学号（优先从 URL 获取，如果没有，则从 localStorage 获取）
const getSno = () => {
  let sno = getQueryParam('sno'); // 尝试从 URL 获取学号
  if (!sno) {
    sno = localStorage.getItem('sno'); // 回退到 localStorage
  }
  if (!sno) {
    throw new Error('学号未设置，请先登录或提供学号');
  }
  return sno;
};

// 获取所有测验
export const getQuizzes = async () => {
  try {
    const sno = getSno();
    const response = await api.get(`/quizzes?sno=${sno}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

// 获取指定 ID 的测验
export const getQuizById = async (quizId) => {
  try {
    const sno = getSno();
    const response = await api.get(`/quizzes/${quizId}?sno=${sno}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching quiz ${quizId}:`, error);
    throw error;
  }
};

// 获取所有分析结果
export const getAnalyses = async () => {
  try {
    const sno = getSno();
    const response = await api.get(`/analyses?sno=${sno}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching analyses:', error);
    throw error;
  }
};

// 获取指定 ID 的分析结果
export const getAnalysisById = async (analysisId) => {
  try {
    const sno = getSno();
    const response = await api.get(`/analyses/${analysisId}?sno=${sno}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching analysis ${analysisId}:`, error);
    throw error;
  }
};

// 生成测验（将 sno 作为 URL 参数，而不是 FormData 传递）
export const generateQuiz = async (formData) => {
  try {
    const sno = getSno();
    const response = await api.post(`/generate-quiz?sno=${sno}`, formData);
    return response.data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

// 分析测验
export const analyzeQuiz = async (answers, quizId) => {
  try {
    const sno = getSno();
    const response = await api.post(`/analyze-quiz?sno=${sno}`, { 
      answers, 
      quiz_id: quizId 
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing quiz:', error);
    throw error;
  }
};

// PDF预览相关接口
export const getPdfPreview = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pdf-preview', formData);
    return response.data;
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw error;
  }
};

export default api;
