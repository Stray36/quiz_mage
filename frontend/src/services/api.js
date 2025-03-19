import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// 创建一个带有基础URL和超时设置的axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时
});

export const getQuizzes = async () => {
  try {
    const response = await api.get('/quizzes');
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching quiz ${quizId}:`, error);
    throw error;
  }
};

export const getAnalyses = async () => {
  try {
    const response = await api.get('/analyses');
    return response.data;
  } catch (error) {
    console.error('Error fetching analyses:', error);
    throw error;
  }
};

export const getAnalysisById = async (analysisId) => {
  try {
    const response = await api.get(`/analyses/${analysisId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching analysis ${analysisId}:`, error);
    throw error;
  }
};

export const generateQuiz = async (formData) => {
  try {
    const response = await api.post('/generate-quiz', formData);
    return response.data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

export const analyzeQuiz = async (answers, quizId) => {
  try {
    const response = await api.post('/analyze-quiz', { 
      answers, 
      quiz_id: quizId 
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing quiz:', error);
    throw error;
  }
};

export default api;