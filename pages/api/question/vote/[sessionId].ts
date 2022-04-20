import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../../lib/db'
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { utils } from "ethers"
import { AbiItem } from 'web3-utils'
import Web3 from 'web3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { questionId, root, nullifierHash, externalNullifier, solidityProof } = JSON.parse(req.body);
  const {
    query: { sessionId }
  } = req

  // const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
  // const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner())
  // const contractOwner = contract.connect(provider.getSigner())

  const web3 = new Web3(process.env.HARMONY_WSS_URL as string);

  let hmyMasterAccount = web3.eth.accounts.privateKeyToAccount("0x" + process.env.HARMONY_PRIVATE_KEY as string);
  web3.eth.accounts.wallet.add(hmyMasterAccount);
  web3.eth.defaultAccount = hmyMasterAccount.address

  const myAddress = web3.eth.defaultAccount;
  console.log('My address: ', myAddress);

  const contract = new web3.eth.Contract(AMA.abi as AbiItem[], CONSTANTS.AMA_CONTRACT_ADDRESS)

  // send onchain
  console.log(sessionId)
  console.log(questionId)
  console.log(root)
  console.log("signal:", utils.formatBytes32String("post"))
  console.log("nullifier hash:", nullifierHash)
  console.log("ext nullifier:", externalNullifier)
  console.log("proof: ", solidityProof)

  try {
    // await contractOwner.voteQuestion(sessionId, questionId, utils.formatBytes32String("vote"), root, nullifierHash, externalNullifier, solidityProof)

    let txn = await contract.methods.voteQuestion(sessionId, questionId, utils.formatBytes32String("vote"), root, nullifierHash, externalNullifier, solidityProof).send({ from: web3.eth.defaultAccount, gas: 6721900 })
    console.log(txn.events)
    let { returnValues } = txn.events.QuestionVoted
    let numVotes = returnValues["votes"]
    let qId = returnValues["questionId"]
    console.log(returnValues)
    console.log(numVotes, "votes for ", qId)


    const result = await excuteQuery({
      query: 'UPDATE ama_questions SET votes = ? WHERE question_id = ?',
      values: [numVotes, qId]
    });
    console.log("QuestionVoted / update DB: ", result)

    res.status(200).end()
  } catch (error: any) {
    const { message } = JSON.parse(error.body).error
    const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))
    res.status(500).send(reason || "Unknown error!")
  }

  // listen for onchain event
  // if onchain updated successfully, update question status (is_posted=1) on offchain db
  // contract.on("QuestionVoted", async (sId, qId, numVotes) => {
  //   console.log("QuestionVoted: ", sId.toNumber(), qId.toNumber(), numVotes.toNumber())
  //   // update offchain db on total votes for question
  //   const result = await excuteQuery({
  //     query: 'UPDATE ama_questions SET votes = ? WHERE question_id = ?',
  //     values: [numVotes.toNumber(), qId.toNumber()]
  //   });
  //   console.log("QuestionVoted / update DB: ", result)
  // })
}