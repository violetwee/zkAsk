import type { NextApiRequest, NextApiResponse } from "next"
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { BigNumber, Contract, providers, utils } from "ethers"
import excuteQuery from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("body: ", req.body);
  const { identityCommitment, accessCode } = req.body;
  const {
    query: { sessionId }
  } = req

  // verify that the access code is valid 
  const accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));

  const result = await excuteQuery({
    query: 'SELECT sessionId FROM ama_sessions WHERE sessionId = ? AND status IN (?, ?) AND (access_code_hash IS NULL OR access_code_hash = ?)',
    values: [sessionId, CONSTANTS.ACTIVE, CONSTANTS.PAUSED, accessCodeHash]
  });

  if (result && result.length > 0) {
    // join AMA session (a.k.a Semaphore Group)
    const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
    const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner())
    const contractOwner = contract.connect(provider.getSigner())

    try {
      await contractOwner.joinAmaSession(sessionId, BigNumber.from(identityCommitment));
      res.status(200).end()
    } catch (error: any) {
      const { message } = JSON.parse(error.body).error
      const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))
      res.status(500).send(reason || "Unknown error!")
    }
  } else {
    res.status(403).send("Invalid access code. Please obtain access code from the host.")
  }
}