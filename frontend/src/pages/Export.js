import React, { useState, useEffect } from "react";
import { Model } from "survey-core";
import { SurveyPDF } from "survey-pdf";
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
  Card,
  CardContent,
  Grid, // 已包含Grid组件
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp"; // 只保留一次导入
import FolderIcon from "@mui/icons-material/Folder";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { getQuizzes, getQuizById } from "../services/api";
import { format } from "date-fns";

export function ExportToPDFPage() {
  // 剩余代码保持不变
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await getQuizzes();
        setQuizzes(data);
        setLoading(false);
      } catch (error) {
        console.error("获取测验列表失败:", error);
        setError("无法加载测验列表。请稍后再试或联系管理员。");
        setLoading(false);
      }
    };

    fetchQuizzes();

    fetchQuizzes();
  }, []);

  const handleSelectQuiz = async (quizId) => {
    try {
      setExporting(true);
      const quizData = await getQuizById(quizId);
      setSelectedQuiz(quizData);
      setExporting(false);
    } catch (error) {
      console.error("获取测验详情失败:", error);
      setError("无法加载测验详情。请稍后再试。");
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedQuiz) return;

    try {
      // 创建PDF实例
      const surveyPDF = new SurveyPDF(selectedQuiz.quiz_json);
      
      // 设置PDF文件名
      const fileName = `${selectedQuiz.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // 配置PDF导出选项
      const options = {
        fontSize: 12,
        margins: {
          left: 10,
          right: 10,
          top: 15,
          bot: 15
        },
        format: [210, 297] // A4 format in mm
      };
      
      // 保存PDF
      surveyPDF.save(fileName, options);
      
    } catch (error) {
      console.error("导出PDF失败:", error);
      setError("导出PDF失败，请稍后再试。");
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "yyyy-MM-dd HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  // 获取难度对应的颜色
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          正在加载测验列表...
        </Typography>
      </Box>
    );
  }

  if (error && !selectedQuiz && !exporting) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      <Typography variant="h4" component="h1" align="center" sx={{ mb: 4 }}>
        导出测验为PDF
      </Typography>

      <Grid container spacing={3}>
        {/* 左侧：测验列表 */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              选择要导出的测验
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {quizzes.length > 0 ? (
              <List>
                {quizzes.map((quiz, index) => (
                  <React.Fragment key={quiz.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        py: 2,
                        cursor: "pointer",
                        bgcolor: selectedQuiz && selectedQuiz.id === quiz.id ? "rgba(25, 118, 210, 0.08)" : "transparent",
                        ":hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                      onClick={() => handleSelectQuiz(quiz.id)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: selectedQuiz && selectedQuiz.id === quiz.id ? "bold" : "normal" }}>
                              {quiz.title}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1, color: "text.secondary" }}>
                              <FolderIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">文件名: {quiz.file_name}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1, color: "text.secondary" }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">创建时间: {formatDate(quiz.created_at)}</Typography>
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
                                label={quiz.difficulty === "easy" ? "简单" : quiz.difficulty === "medium" ? "中等" : "困难"}
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
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  暂无测验历史
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  您还没有生成任何测验，无法导出PDF。
                </Typography>
                <Button 
                  variant="contained" 
                  href="/"
                  color="primary"
                >
                  创建测验
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 右侧：导出选项和预览 */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              导出选项
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {exporting ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress size={40} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  正在准备导出...
                </Typography>
              </Box>
            ) : selectedQuiz ? (
              <Box>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      已选择测验
                    </Typography>
                    <Typography variant="body1">{selectedQuiz.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {selectedQuiz.question_count} 道题目 | 
                      {selectedQuiz.difficulty === "easy" ? " 简单" : selectedQuiz.difficulty === "medium" ? " 中等" : " 困难"} 难度
                    </Typography>
                  </CardContent>
                </Card>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={<GetAppIcon />}
                  onClick={handleExportPDF}
                  sx={{ py: 1.5 }}
                >
                  导出为PDF
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
                  导出后将自动下载PDF文件
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  请从左侧列表选择一个测验进行导出
                </Typography>
              </Box>
            )}
          </Paper>

          {/* PDF 提示信息卡片 */}
          <Paper elevation={1} sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: "info.light", color: "info.contrastText" }}>
            <Typography variant="subtitle2" gutterBottom>
              PDF导出说明
            </Typography>
            <Typography variant="body2">
              - PDF文件将包含测验题目和选项
            </Typography>
            <Typography variant="body2">
              - 动态特性(如验证、导航按钮等)不会在PDF中显示
            </Typography>
            <Typography variant="body2">
              - 导出后可用于打印或分享测验
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}