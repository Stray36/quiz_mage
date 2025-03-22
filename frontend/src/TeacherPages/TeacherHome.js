// src/pages/Home.js
import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { useHistory } from "react-router-dom";
import { generateQuiz } from "../services/api";
import PdfPreview from '../components/PdfPreview';

// 自定义文件上传按钮样式
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export function TeacherHome() {
  const history = useHistory();
  const [file, setFile] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [selectedPages, setSelectedPages] = useState([]);
  const [isPdf, setIsPdf] = useState(false);

  // 题目类型状态
  const [questionTypes, setQuestionTypes] = useState({
    multipleChoice: true,
    fillInBlank: false
  });

  const handleFileUpload = (event) => {
    if (event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileSelected(true);
      setError(null);
      
      // 检查是否为PDF文件
      const isPdfFile = selectedFile.type === 'application/pdf' || 
                       selectedFile.name.toLowerCase().endsWith('.pdf');
      setIsPdf(isPdfFile);
      
      // 如果是PDF文件，显示预览对话框
      if (isPdfFile) {
        setShowPdfPreview(true);
      } else {
        // 如果不是PDF，重置选定页面
        setSelectedPages([]);
      }
    }
  };

  // 处理题目类型变更
  const handleQuestionTypeChange = (event) => {
    const { name, checked } = event.target;
    
    // 至少需要选择一种题型
    if (name === 'multipleChoice' && !checked && !questionTypes.fillInBlank) {
      return; // 不允许取消选择此类型，因为它是最后一个被选择的
    }
    if (name === 'fillInBlank' && !checked && !questionTypes.multipleChoice) {
      return; // 同上
    }
    
    setQuestionTypes({
      ...questionTypes,
      [name]: checked
    });
  };

  // 处理页面选择完成
  const handlePagesSelected = (pages) => {
    setSelectedPages(pages);
    setShowPdfPreview(false);
  };

  // 关闭PDF预览对话框
  const handleClosePdfPreview = () => {
    setShowPdfPreview(false);
    // 如果用户取消了预览而没有选择页面，重置文件选择
    if (selectedPages.length === 0) {
      setFile(null);
      setFileSelected(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("questionCount", questionCount);
    formData.append("difficulty", difficulty);
    
    // 添加题目类型信息
    formData.append("includeMultipleChoice", questionTypes.multipleChoice);
    formData.append("includeFillInBlank", questionTypes.fillInBlank);
    
    // 添加备注信息到表单数据
    if (notes.trim()) {
      formData.append("notes", notes);
    }
    
    // 添加选定页面信息
    if (isPdf && selectedPages.length > 0) {
      formData.append("selectedPages", JSON.stringify(selectedPages));
    }

    try {
      // 修改: 从响应中获取quiz_id
      const response = await generateQuiz(formData);
      setLoading(false);
      
      // 生成成功后直接跳转到相应测验页面
      history.push(`/survey/${response.quiz_id}`);
    } catch (error) {
      setLoading(false);
      console.error("Error details:", error.response?.data);
      const errorMessage = error.response?.data?.error || error.message;
      setError(`生成失败: ${errorMessage}`);
    }
  };

  return (
    <Box sx={{ my: 4 }}>
      {/* <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        知识测验生成器
      </Typography> */}

      <Grid container justifyContent="center">
        <Grid item xs={12} sm={10} md={8} lg={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              background: 'linear-gradient(to bottom, #ffffff, #f9f9f9)'
            }}
          >
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  sx={{ px: 3, py: 1.5 }}
                >
                  上传知识库文档 (PDF/TXT)
                  <VisuallyHiddenInput type="file" accept=".pdf,.txt" onChange={handleFileUpload} />
                </Button>
                {fileSelected && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      已选择文件: {file?.name}
                    </Typography>
                    {isPdf && selectedPages.length > 0 && (
                      <Typography variant="body2" sx={{ color: 'info.main', mt: 0.5 }}>
                        已选择 {selectedPages.length} 页
                        <Button 
                          size="small" 
                          sx={{ ml: 1 }} 
                          onClick={() => setShowPdfPreview(true)}
                        >
                          重新选择
                        </Button>
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth
                label="题目数量"
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                InputProps={{ inputProps: { min: 5, max: 20 } }}
                margin="normal"
                required
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>难度等级</InputLabel>
                <Select
                  value={difficulty}
                  label="难度等级"
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <MenuItem value="easy">简单</MenuItem>
                  <MenuItem value="medium">中等</MenuItem>
                  <MenuItem value="hard">困难</MenuItem>
                </Select>
              </FormControl>

              {/* 添加题目类型选择 */}
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  题目类型
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={questionTypes.multipleChoice} 
                        onChange={handleQuestionTypeChange} 
                        name="multipleChoice" 
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span>选择题</span>
                        {questionTypes.multipleChoice && (
                          <Chip 
                            label="默认" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1, height: 20 }} 
                          />
                        )}
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={questionTypes.fillInBlank} 
                        onChange={handleQuestionTypeChange} 
                        name="fillInBlank" 
                      />
                    }
                    label="填空题"
                  />
                </FormGroup>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 添加备注文本框 */}
              <TextField
                fullWidth
                label="备注（可选）"
                placeholder="添加测验生成的特殊要求或附加信息"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                helperText="例如：侧重某个章节、题型偏好、特定知识点等"
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || !file}
                  sx={{ px: 4, py: 1.2 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : '生成测验'}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ mt: 4, p: 3, backgroundColor: 'rgba(25, 118, 210, 0.05)', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>使用说明</Typography>
            <Typography variant="body1" paragraph>
              1. 上传含有学习内容的PDF或TXT文档
            </Typography>
            <Typography variant="body1" paragraph>
              2. 选择要生成的题目数量和难度级别
            </Typography>
            <Typography variant="body1" paragraph>
              3. 选择题目类型（选择题和/或填空题）
            </Typography>
            <Typography variant="body1" paragraph>
              4. 可选：添加备注信息以定制测验内容
            </Typography>
            <Typography variant="body1" paragraph>
              5. 点击"生成测验"按钮创建测验
            </Typography>
            <Typography variant="body1">
              6. 生成后，点击顶部导航栏中的"测验"开始答题
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* PDF预览对话框 */}
      {showPdfPreview && file && (
        <PdfPreview 
          file={file} 
          onPagesSelected={handlePagesSelected} 
          onClose={handleClosePdfPreview} 
        />
      )}
    </Box>
  );
}