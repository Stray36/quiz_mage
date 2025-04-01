import React from "react";
import { BrowserRouter, Switch, Route, Link, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import SchoolIcon from "@mui/icons-material/School";

import "./App.css";
import { HomePage } from "./pages/Home";
import { SurveyPage } from "./pages/Survey";
import { QuizPage } from "./pages/Quiz";
import { QuizHistoryPage } from "./pages/QuizHistory";
import { ExportToPDFPage } from "./pages/Export";
import { AnalyticsPage } from "./pages/Analytics";
import { AnalyticsHistoryPage } from "./pages/AnalyticsHistory";
import { SpecificSurveyPage } from "./pages/SpecificSurvey";
import { SpecificAnalyticsPage } from "./pages/SpecificAnalytics";

import { TeacherHome } from "./TeacherPages/TeacherHome";
import { TeacherQuizHistoryPage } from "./TeacherPages/TeacherQuizHistory"; 
import { HomeworkPage }  from "./TeacherPages/HomeworkAnalytics";
import { TeacherAnalyticsPage } from "./TeacherPages/TeacherAnalytics";
import { SpecificHomeworkPage } from "./TeacherPages/SpecificHomework";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

export { MyQuestion } from "./components/MyQuestion";

// 解析 URL 参数
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#f50057" },
    background: { default: "#f5f5f5" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: "2.2rem", fontWeight: 500, marginBottom: "1rem" },
    h2: { fontSize: "1.8rem", fontWeight: 500, marginBottom: "0.75rem" },
    h3: { fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.5rem" },
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
  },
});

function App() {
  const sno = getQueryParam("sno"); // 获取学号
  const tno = getQueryParam("tno"); // 获取教师号

  if (tno) return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <div>
          <AppBar position="static" color="primary">
            <Toolbar>
              <SchoolIcon sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Auto Quiz Generator
              </Typography>
              <Button color="inherit" component={Link} to={`/?tno=${tno}`}>
                生成测验
              </Button>
              <Button color="inherit" component={Link} to={`/survey?tno=${tno}`}>
                测验历史
              </Button>
              {/* <Button color="inherit" component={Link} to={`/analytics?tno=${tno}`}>
                测验分析
              </Button> */}
              <Button color="inherit" component={Link} to={`/HWanalytics?tno=${tno}`}>
                作业分析
              </Button>
              <Button color="inherit" component={Link} to={`/export?tno=${tno}`}>
                导出
              </Button> 
              <Button color="inherit" onClick={() => (window.location.href = `http://127.0.0.1:5000/teacher/${tno}`)}>
                回到课程系统
              </Button>
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ py: 2 }}>
              <Switch>
                <Route path="/survey/:quizId" render={(props) => <SpecificSurveyPage {...props} tno={tno} />} />
                <Route path="/survey" render={(props) => <TeacherQuizHistoryPage {...props} tno={tno} />} />
                <Route path="/analytics/:analysisId" render={(props) => <TeacherAnalyticsPage {...props} tno={tno} />} />
                <Route path="/HWanalytics" render={(props) => <HomeworkPage {...props} tno={tno} />} />
                <Route path="/HWanalytics/:analysisId" render={(props) => <SpecificHomeworkPage {...props} tno={tno} />} />
                <Route path="/export" render={(props) => <ExportToPDFPage {...props} tno={tno} />} />
                <Route path="/" render={(props) => <TeacherHome {...props} tno={tno} />} />
              </Switch>
            </Box>
          </Container>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
  else return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <div>
          <AppBar position="static" color="primary">
            <Toolbar>
              <SchoolIcon sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Auto Quiz Generator
              </Typography>
              <Button color="inherit" component={Link} to={`/?sno=${sno}`}>
                首页
              </Button>
              <Button color="inherit" component={Link} to={`/quiz?sno=${sno}`}>
                查看测验
              </Button>
              <Button color="inherit" component={Link} to={`/survey?sno=${sno}`}>
                查看作业
              </Button>
              <Button color="inherit" component={Link} to={`/analytics?sno=${sno}`}>
                分析
              </Button>
              <Button color="inherit" component={Link} to={`/export?sno=${sno}`}>
                导出
              </Button>
              <Button color="inherit" onClick={() => (window.location.href = `http://127.0.0.1:5000/student/${sno}`)}>
                回到课程系统
              </Button>
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ py: 2 }}>
              <Switch>
                <Route path="/survey/:quizId" render={(props) => <SpecificSurveyPage {...props} sno={sno} />} />
                <Route path="/quiz" render={(props) => <QuizPage {...props} sno={sno} />} />
                <Route path="/survey" render={(props) => <QuizHistoryPage {...props} sno={sno} />} />
                <Route path="/analytics/:analysisId" render={(props) => <SpecificAnalyticsPage {...props} sno={sno} />} />
                <Route path="/analytics" render={(props) => <AnalyticsHistoryPage {...props} sno={sno} />} />
                <Route path="/export" render={(props) => <ExportToPDFPage {...props} sno={sno} />} />
                <Route path="/" render={(props) => <HomePage {...props} sno={sno} />} />
              </Switch>
            </Box>
          </Container>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
