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
    sno = 0; // 回退到 localStorage
  }

  return sno;
};

// 获取所有测验
export const getQuizzes_0 = async () => {
  try {
    const sno = getSno();
    const response = await api.get(`/auto_quiz?sno=${sno}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

// 获取所有作业
export const getQuizzes = async () => {
  try {
    const sno = getSno();
    const tno = getTno();

    if(sno){
      const response = await api.get(`/quizzes?sno=${sno}`);
      return response.data;
    }
    else{
       const response = await api.get(`/quizzes?tno=${tno}`);
       return response.data;
     }
  
  } catch (error) {
    console.error('Error fetching homework:', error);
    throw error;
  }
};

// 获取所有班级
export const getClasses = async () => {
  try {
    const tno = getTno();
    const response = await api.get(`/classes?tno=${tno}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
}

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

// 获取学生所有测验的分析结果
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


// 获取老师所有测验的分析结果
export const getTeacherQuizAnalyses = async () => {
  try {
    const tno = getTno();
    const response = await api.get(`/teacher_analyses?tno=${tno}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching analyses:', error);
    throw error;
  }
};


// 获取老师已发布作业的分析结果
export const getTeacherAnalyses = async () => {
  try {
    const tno = getTno();
    const response = await api.get(`/analyses?tno=${tno}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching analyses:', error);
    throw error;
  }
}

// 获取该老师发布的作业
export const getHomework = async () => {
  try {
    const tno = getTno();
    const response = await api.get(`/homework?tno=${tno}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching homework:', error);
    throw error;
  }
}

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

// 获取指定 ID 的分析结果（教师）
export const getTeacherAnalysisById = async (analysisId) => {
  try {
    const tno = getTno();
    const response = await api.get(`/teacher_analyses/${analysisId}?tno=${tno}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching analysis ${analysisId}:`, error);
    throw error;
  }
}

// 生成测验
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


export const publishQuiz = async (quizId, cno) => {
  try {
    const response = await api.post(`/quizzes/${quizId}/publish`, { cno });
    return response.data;
  } catch (error) {
    console.error('Error publishing quiz:', error);
    throw error;
  }
}

// 学生的分析测验
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

// 教师的分析测验
export const analyzeTeacherQuiz = async (answers, quizId) => {
  try {
    const tno = getTno();
    const response = await api.post(`/analyze-quiz?tno=${tno}`, { 
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


const getTno = () => {
  let tno = getQueryParam('tno'); // 尝试从 URL 获取学号
  if (!tno) {
    tno = 0; // 回退到 localStorage
  }
  return tno;
};


// 生成测验
export const generateQuiz4teacher = async (formData) => {
  try {
    const tno = getTno();
    const response = await api.post(`/generate-quiz?tno=${tno}`, formData);
    return response.data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

export const getErrorRates = async (quizId) => {
  try {
    const response = await api.get(`/error-rates/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching error rates:', error);
    throw error;
  }
}

export const getWordCloud = async (quizId) => {
  try {
    const response = await api.get(`/word_cloud/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching error:', error);
    throw error;
  }
}