import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from 'lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { owner } = req.body;

  const {
    query: { sessionId }
  } = req

  let now = Math.floor(Date.now() / 1000);
  try {
    await excuteQuery({
      query: 'UPDATE ama_sessions SET is_posted = ?, updated_at = ? WHERE session_id = ? AND owner = ?',
      values: [1, now, sessionId, owner]
    });
    res.status(200).end()
  } catch (error: any) {
    res.status(500).send(error.reason || "Failed to set session to posted")
  }
}