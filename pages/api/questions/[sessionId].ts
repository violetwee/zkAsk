import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { sessionId }
  } = req

  const result = await excuteQuery({
    query: 'SELECT questionId, content, created_at FROM ama_questions WHERE sessionId = ? AND is_posted = ?',
    values: [sessionId, 1]
  });
  console.log(result)
  res.status(200).send(result)
}