CREATE TABLE `ama_questions`
(
  `question_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `content` varchar
(1024) CHARACTER
SET utf8
COLLATE utf8_general_ci NOT NULL,
  `created_at` int DEFAULT NULL,
  `is_posted` tinyint
(1) DEFAULT '0',
  `votes` int DEFAULT '0',
  PRIMARY KEY
(`question_id`),
  UNIQUE KEY `questionId_UNIQUE`
(`question_id`),
  KEY `sessionId_idx`
(`session_id`),
  CONSTRAINT `sessionId` FOREIGN KEY
(`session_id`) REFERENCES `ama_sessions`
(`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci