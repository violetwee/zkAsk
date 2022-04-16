import type { NextApiRequest, NextApiResponse } from "next"
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers } from "ethers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { sessionId }
  } = req

  const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
  const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner())
  let contractOwner = contract.connect(provider.getSigner())

  const identityCommitmentsBN = await contractOwner.getIdentityCommitments(sessionId);
  let identityCommitments = [];
  console.log("getIdentityCommitments", identityCommitmentsBN)
  for (var i = 0; i < identityCommitmentsBN.length; i++) {
    identityCommitments.push(identityCommitmentsBN[i].toString());
}
  res.status(200).send(identityCommitments)

}