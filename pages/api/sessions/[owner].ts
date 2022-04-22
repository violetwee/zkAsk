import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { owner }
  } = req

  const result = await excuteQuery({
    query: 'SELECT session_id, name, hosts, description, owner, created_at, status FROM ama_sessions WHERE owner = ? order by session_id ASC',
    values: [owner]
  });
  res.status(200).send(result)
}