import type { NextApiRequest, NextApiResponse } from "next"
import { getContract } from 'lib/contract'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { sessionId }
  } = req

  const { contract, account } = await getContract()

  const identityCommitmentsBN = await contract.methods.getIdentityCommitments(sessionId).call({ from: account, gas: 6721900 })
  let identityCommitments = [];
  for (var i = 0; i < identityCommitmentsBN.length; i++) {
    identityCommitments.push(identityCommitmentsBN[i].toString());
  }
  res.status(200).send(identityCommitments)
}