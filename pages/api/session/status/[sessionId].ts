import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../../lib/db'
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers } from "ethers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("body: ", req.body);
  const { command } = req.body;
  const {
    query: { sessionId }
  } = req

  const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
  const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner())
  let owner = contract.connect(provider.getSigner())

  // update status onchain based on current status
  try {
    switch (command) {
      case "start":
        await owner.startAmaSession(sessionId);
        break;
      case "pause":
        await owner.pauseAmaSession(sessionId);
        break;
      case "resume":
        await owner.resumeAmaSession(sessionId);
        break;
      case "end":
        await owner.endAmaSession(sessionId);

        break;
      default: console.log("Invalid command")
    }
    res.status(200).end()
  } catch (error: any) {
    console.log("Update status error", error)
    res.status(500).send(error)
  }

  // listen for onchain event
  // if onchain updated successfully, update status offchain
  contract.on("AmaSessionStatusChanged", async (sId, statusId) => {
    console.log("AmaSessionStatusChanged: ", sId.toNumber(), statusId.toNumber())
    await excuteQuery({
      query: 'UPDATE ama_sessions SET status = ? WHERE sessionId = ?',
      values: [statusId.toNumber(), sessionId]
    });
  })

}