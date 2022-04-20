import type { NextApiRequest, NextApiResponse } from "next"
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { BigNumber, utils } from "ethers"
import excuteQuery from '../../../../lib/db'
import { AbiItem } from 'web3-utils'
import Web3 from 'web3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("body: ", req.body);
  const { identityCommitment, accessCode } = req.body;
  const {
    query: { sessionId }
  } = req

  // verify that the access code is valid 
  const accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));

  const result = await excuteQuery({
    query: 'SELECT session_id FROM ama_sessions WHERE session_id = ? AND status IN (?, ?) AND (access_code_hash IS NULL OR access_code_hash = ?)',
    values: [sessionId, CONSTANTS.ACTIVE, CONSTANTS.PAUSED, accessCodeHash]
  });

  if (result && result.length > 0) {
    // join AMA session (a.k.a Semaphore Group)
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

    try {
      // await contractOwner.joinAmaSession(sessionId, BigNumber.from(identityCommitment));
      await contract.methods.joinAmaSession(sessionId, BigNumber.from(identityCommitment)).send({ from: web3.eth.defaultAccount, gas: 6721900 })
      res.status(200).end()
    } catch (error: any) {
      const { message } = JSON.parse(error.body).error
      const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))
      res.status(500).send(reason || "Unknown error!")
    }
  } else {
    res.status(500).send("Invalid access code. Please obtain access code from the host.")
  }
}