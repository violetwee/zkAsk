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
    console.log("signal:",utils.formatBytes32String("post"))
    console.log("nullifier hash:", nullifierHash)
    console.log("ext nullifier:", externalNullifier)
    console.log("proof: ", solidityProof)
    
    // contract.postQuestion(sessionIds[0], questionIds[0], bytes32Signal0, merkleProof.root, publicSignals.nullifierHash, publicSignals.externalNullifier, solidityProof)
  const txn =  await contractOwner.postQuestion(sessionId, questionId, utils.formatBytes32String("post"), root, nullifierHash, externalNullifier, solidityProof)
  console.log(txn)
  // listen for onchain event
  // if onchain updated successfully, update question status (is_posted=1) on offchain db
  contract.on("NewQuestion", async (sId, qId, signal) => {
    console.log("NewQuestion: ", sId.toNumber(), qId.toNumber(), signal)
    const result = await excuteQuery({
      query: 'UPDATE ama_questions SET is_posted = ? WHERE questionId = ?',
      values: [1, questionId]
    });
    console.log("NewQuestion / update DB: ", result)
    if (result)
      res.status(200).end()
    else res.status(500).send("Unable to post question")
  })
  
}