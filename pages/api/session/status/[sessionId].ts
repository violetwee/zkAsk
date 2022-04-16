import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../../lib/db'
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers, utils } from "ethers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("body: ", req.body);
  const { command, ownerAddress } = req.body;
  const {
    query: { sessionId }
  } = req

  const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
  const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner(ownerAddress))
  let owner = contract.connect(provider.getSigner(ownerAddress))
  let newStatus: number = 0;

  // update status onchain based on current status
  switch (command) {
    case "start":
      await owner.startAmaSession(sessionId);
      newStatus = CONSTANTS.ACTIVE;
      break;
    case "pause":
      await owner.pauseAmaSession(sessionId);
      newStatus = CONSTANTS.PAUSED;
      break;
    case "resume":
      await owner.resumeAmaSession(sessionId);
      newStatus = CONSTANTS.ACTIVE;
      break;
    case "end":
      await owner.endAmaSession(sessionId);
      newStatus = CONSTANTS.ENDED;
      break;
    default: console.log("Invalid command")
  }

  // listen for onchain event
  // if onchain updated successfully, update status offchain
  contract.on("AmaSessionActive", async (sId) => {
    console.log("AmaSessionActive: ", sId.toNumber())
    const result = await excuteQuery({
      query: 'UPDATE ama_sessions SET status = ? WHERE sessionId = ?',
      values: [newStatus, sessionId]
    });
    console.log("AmaSessionActive / update DB: ", result)
    if (result)
      res.status(200).send(result)
    else res.status(500).send("Unable to update session status")
  })

}