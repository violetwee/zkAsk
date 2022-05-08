CREATE TABLE `ama_sessions`
(
  `session_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar
(256) CHARACTER
SET utf8
COLLATE utf8_general_ci DEFAULT NULL,
  `hosts` varchar
(256) CHARACTER
SET utf8
COLLATE utf8_general_ci DEFAULT NULL,
  `description` varchar
(1024) CHARACTER
SET utf8
COLLATE utf8_general_ci DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `owner` varchar
(64) NOT NULL,
  `status` int DEFAULT '1' COMMENT '1=Not Started\\n2=Paused\\n3=Active\\n4=Ended',
  `access_code_hash` varchar
(256) DEFAULT NULL,
  `is_posted` tinyint
(1) DEFAULT '0',
  `created_at` int DEFAULT NULL,
  PRIMARY KEY
(`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=255 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci