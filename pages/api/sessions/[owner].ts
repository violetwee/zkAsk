import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { owner }
  } = req

  const result = await excuteQuery({
    query: 'SELECT session_id, name, hosts, description, owner, created_at, updated_at, status FROM ama_sessions WHERE owner = ? AND is_posted = ? order by session_id DESC',
    values: [owner, 1]
  });
  res.status(200).send(result)
}