import type { NextApiRequest, NextApiResponse } from "next"
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
// import { Contract, providers } from "ethers"
import { AbiItem } from 'web3-utils'
import Web3 from 'web3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { sessionId }
  } = req

  // const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
  // const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner())
  // let contractOwner = contract.connect(provider.getSigner())

  const web3 = new Web3(process.env.HARMONY_WSS_URL as string);

  let hmyMasterAccount = web3.eth.accounts.privateKeyToAccount("0x" + process.env.HARMONY_PRIVATE_KEY as string);
  web3.eth.accounts.wallet.add(hmyMasterAccount);
  web3.eth.defaultAccount = hmyMasterAccount.address

  const myAddress = web3.eth.defaultAccount;
  console.log('My address: ', myAddress);

  const contract = new web3.eth.Contract(AMA.abi as AbiItem[], CONSTANTS.AMA_CONTRACT_ADDRESS)

  // const identityCommitmentsBN = await contractOwner.getIdentityCommitments(sessionId);
  const identityCommitmentsBN = await contract.methods.getIdentityCommitments(sessionId).call({ from: web3.eth.defaultAccount, gas: 6721900 })
  let identityCommitments = [];
  for (var i = 0; i < identityCommitmentsBN.length; i++) {
    identityCommitments.push(identityCommitmentsBN[i].toString());
  }
  res.status(200).send(identityCommitments)

}