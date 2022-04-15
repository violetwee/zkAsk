import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { sessionId }
  } = req

  const result = await excuteQuery({
    query: 'SELECT sessionId, name, hosts, description, owner, created_at, status) FROM ama_sessions WHERE sessionId = ?',
    values: [sessionId]
  });

  console.log(result)
  if (result && result.ok) {
    res.status(200).send(result)
  }
  else res.status(result.status).send(result)
}