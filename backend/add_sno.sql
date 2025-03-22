ALTER TABLE quizzes ADD sno TEXT DEFAULT '20240000';

UPDATE quizzes SET sno = '20240000';

SELECT sno = '20240000' FROM quizzes;

ALTER TABLE analysis_results ADD sno TEXT DEFAULT '20240000';

UPDATE analysis_results SET sno = '20240000';

SELECT * FROM analysis_results WHERE id = 1 AND sno = '20240000'