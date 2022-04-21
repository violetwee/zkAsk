import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from 'lib/db'
import { CONSTANTS } from 'lib/constants'
import { getContract } from 'lib/contract'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("body: ", req.body);
  const { command } = req.body;
  const {
    query: { sessionId }
  } = req

  const { contract, account } = await getContract()

  // update status onchain based on current status
  try {
    switch (command) {
      case "start":
        // await owner.startAmaSession(sessionId);
        await contract.methods.startAmaSession(sessionId).send({ from: account, gas: 6721900 })
        await excuteQuery({
          query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
          values: [CONSTANTS.ACTIVE, sessionId]
        });
        break;
      case "pause":
        // await owner.pauseAmaSession(sessionId);
        await contract.methods.pauseAmaSession(sessionId).send({ from: account, gas: 6721900 });
        await excuteQuery({
          query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
          values: [CONSTANTS.PAUSED, sessionId]
        });
        break;
      case "resume":
        // await owner.resumeAmaSession(sessionId);
        await contract.methods.resumeAmaSession(sessionId).send({ from: account, gas: 6721900 });
        await excuteQuery({
          query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
          values: [CONSTANTS.ACTIVE, sessionId]
        });
        break;
      case "end":
        // await owner.endAmaSession(sessionId);
        await contract.methods.endAmaSession(sessionId).send({ from: account, gas: 6721900 });
        await excuteQuery({
          query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
          values: [CONSTANTS.ENDED, sessionId]
        });
        break;
      default: console.log("Invalid command")
    }
    res.status(200).end()
  } catch (error: any) {
    console.log(error)
    res.status(500).send(error.reason || "Failed to update status")
  }
}