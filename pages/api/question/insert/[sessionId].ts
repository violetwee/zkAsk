import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { content } = req.body;
  const {
    query: { sessionId }
  } = req

  // store question to offchain first because we need the question id 
  // questions are not posted to site until post to onchain is successful
  const result = await excuteQuery({
    query: 'INSERT INTO ama_questions (session_id, content, created_at, is_posted) VALUES (?, ?, ?, ?)',
    values: [sessionId, content, Math.floor(Date.now() / 1000), 0]
  });

  if (result && result.insertId)
    res.status(200).send(result.insertId)
  else res.status(500).send("Unable to post question")

}