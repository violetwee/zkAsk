import type { NextApiRequest, NextApiResponse } from "next"
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers, BigNumber } from "ethers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("body: ", req.body);
  const { identityCommitment } = req.body;
  const {
    query: { sessionId }
  } = req

  const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
  const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner())
  const contractOwner = contract.connect(provider.getSigner())

  // join AMA session (a.k.a Semaphore Group)
  try {
    await contractOwner.joinAmaSession(sessionId, BigNumber.from(identityCommitment));
    res.status(200).end()
  } catch (error: any) {
    const { message } = JSON.parse(error.body).error
    const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))
    res.status(500).send(reason || "Unknown error!")
  }
}