import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { sessionId }
  } = req

  const result = await excuteQuery({
    query: 'SELECT session_id, name, hosts, description, owner, created_at, status FROM ama_sessions WHERE session_id = ?',
    values: [sessionId]
  });
  if (result && result.length > 0)
    return res.status(200).send(result[0])

  return res.status(500).send("Unable to fetch session data")
}