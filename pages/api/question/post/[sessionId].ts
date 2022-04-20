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

  // contract.postQuestion(sessionIds[0], questionIds[0], bytes32Signal0, merkleProof.root, publicSignals.nullifierHash, publicSignals.externalNullifier, solidityProof)
  // const txn = await contractOwner.postQuestion(sessionId, questionId, utils.formatBytes32String("post"), root, nullifierHash, externalNullifier, solidityProof)
  const txn = await contract.methods.postQuestion(sessionId, questionId, utils.formatBytes32String("post"), root, nullifierHash, externalNullifier, solidityProof).send({ from: web3.eth.defaultAccount, gas: 6721900 })
  console.log(txn)

  const result = await excuteQuery({
    query: 'UPDATE ama_questions SET is_posted = ? WHERE question_id = ?',
    values: [1, questionId]
  });
  console.log("NewQuestion / update DB: ", result)
  if (result)
    res.status(200).end()
  else res.status(500).send("Unable to post question")

  // listen for onchain event
  // if onchain updated successfully, update question status (is_posted=1) on offchain db
  // contract.on("NewQuestion", async (sId, qId, signal) => {
  //   console.log("NewQuestion: ", sId.toNumber(), qId.toNumber(), signal)
  //   const result = await excuteQuery({
  //     query: 'UPDATE ama_questions SET is_posted = ? WHERE question_id = ?',
  //     values: [1, questionId]
  //   });
  //   console.log("NewQuestion / update DB: ", result)
  //   if (result)
  //     res.status(200).end()
  //   else res.status(500).send("Unable to post question")
  // })

}