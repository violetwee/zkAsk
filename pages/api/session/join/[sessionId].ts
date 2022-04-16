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
  await contractOwner.joinAmaSession(sessionId, BigNumber.from(identityCommitment));

  // listen for onchain event
  // if onchain updated successfully, update status offchain
  contract.on("UserJoinedAmaSession", async (sId, iCommitment) => {
    console.log("UserJoinedAmaSession: ", sId.toNumber(), iCommitment)
    res.status(200).end()
  })
}