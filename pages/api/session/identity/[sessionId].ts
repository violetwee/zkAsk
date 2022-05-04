import type { NextApiRequest, NextApiResponse } from "next"
import { getContract } from 'lib/contract'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { sessionId }
  } = req
  try {
    const { contract, account } = await getContract()

    let options = { from: account, gas: 6721900 };
    let identityCommitments: any = [];
    const identityCommitmentsBN = await contract.methods.getIdentityCommitments(sessionId).call(options)

    for (var i = 0; i < identityCommitmentsBN.length; i++) {
      identityCommitments.push(identityCommitmentsBN[i].toString());
    }
    res.status(200).send(identityCommitments)

  } catch (error: any) {
    res.status(500).send(error.reason || "Failed to join session")
  }
}