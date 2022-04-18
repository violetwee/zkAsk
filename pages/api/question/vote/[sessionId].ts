import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../../lib/db'
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers, utils } from "ethers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { questionId, root, nullifierHash, externalNullifier, solidityProof } = JSON.parse(req.body);
  const {
    query: { sessionId }
  } = req

  const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
  const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner())
  const contractOwner = contract.connect(provider.getSigner())

  // send onchain
  console.log(sessionId)
  console.log(questionId)
  console.log(root)
  console.log("signal:", utils.formatBytes32String("post"))
  console.log("nullifier hash:", nullifierHash)
  console.log("ext nullifier:", externalNullifier)
  console.log("proof: ", solidityProof)

  try {
    await contractOwner.voteQuestion(sessionId, questionId, utils.formatBytes32String("vote"), root, nullifierHash, externalNullifier, solidityProof)

    res.status(200).end()
  } catch (error: any) {
    const { message } = JSON.parse(error.body).error
    const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))
    res.status(500).send(reason || "Unknown error!")
  }

  // listen for onchain event
  // if onchain updated successfully, update question status (is_posted=1) on offchain db
  contract.on("QuestionVoted", async (sId, qId, numVotes) => {
    console.log("QuestionVoted: ", sId.toNumber(), qId.toNumber(), numVotes.toNumber())
    // update offchain db on total votes for question
    const result = await excuteQuery({
      query: 'UPDATE ama_questions SET votes = ? WHERE questionId = ?',
      values: [numVotes.toNumber(), qId.toNumber()]
    });
    console.log("QuestionVoted / update DB: ", result)
  })
}