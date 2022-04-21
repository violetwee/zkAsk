import type { NextApiRequest, NextApiResponse } from "next"
import { CONSTANTS } from 'lib/constants'
import { BigNumber, utils } from "ethers"
import excuteQuery from 'lib/db'
import { getContract } from 'lib/contract'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("body: ", req.body);
  const { identityCommitment, accessCode } = req.body;
  const {
    query: { sessionId }
  } = req

  // verify that the access code is valid 
  const accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));

  const result = await excuteQuery({
    query: 'SELECT session_id FROM ama_sessions WHERE session_id = ? AND status IN (?, ?) AND (access_code_hash IS NULL OR access_code_hash = ?)',
    values: [sessionId, CONSTANTS.ACTIVE, CONSTANTS.PAUSED, accessCodeHash]
  });

  if (result && result.length > 0) {
    // join AMA session (a.k.a Semaphore Group)
    const { contract, account } = await getContract()

    try {
      await contract.methods.joinAmaSession(sessionId, BigNumber.from(identityCommitment)).send({ from: account, gas: 6721900 })
      res.status(200).end()
    } catch (error: any) {
      console.log(error.reason)
      res.status(500).send(error.reason || "Failed to join session")
    }
  } else {
    res.status(500).send("Invalid access code. Please obtain access code from the host.")
  }
}