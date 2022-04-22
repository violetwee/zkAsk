import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from 'lib/db'
import { getContract } from 'lib/contract'
import { utils } from "ethers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { questionId, root, nullifierHash, externalNullifier, solidityProof } = JSON.parse(req.body);
  const {
    query: { sessionId }
  } = req

  const { contract, account } = await getContract()

  // send onchain
  try {
    let txn = await contract.methods.voteQuestion(sessionId, questionId, utils.formatBytes32String("vote"), root, nullifierHash, externalNullifier, solidityProof).send({ from: account, gas: 6721900 })
    // console.log(txn.events)

    let { returnValues } = txn.events.QuestionVoted
    let numVotes = returnValues["votes"]
    let qId = returnValues["questionId"]

    // update offchain db
    const result = await excuteQuery({
      query: 'UPDATE ama_questions SET votes = ? WHERE question_id = ?',
      values: [numVotes, qId]
    });
    console.log("QuestionVoted / update DB: ", result)

    res.status(200).end()
  } catch (error: any) {
    console.log(error.reason)
    res.status(500).send(error.reason || "Failed to vote for question")
  }
}