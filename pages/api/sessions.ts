import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../lib/db'
import { CONSTANTS } from '../../lib/constants'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // get sessions from database
    const result = await excuteQuery({
      query: 'SELECT sessionId, name, hosts, description, owner, created_at, status FROM ama_sessions WHERE status IN (?, ?)',
      values: [CONSTANTS.PAUSED, CONSTANTS.ACTIVE]
    });

    console.log(result)
    if (result && result.length > 0) {
      res.status(200).send(result)
    } else {
      console.log("Unable to fetch AMA sessions")
      res.status(result.status).send(result)
    }

  } catch (error: any) {
    res.status(500).send(error)
  }
}