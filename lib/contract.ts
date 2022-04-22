import Web3 from 'web3'
import config from './config.json'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { AbiItem } from 'web3-utils'

const getContract = async () => {
  const web3 = new Web3(process.env.HMY_WSS_URL as string);
  web3.eth.handleRevert = true // return custom error messages from contract

  let hmyMasterAccount = web3.eth.accounts.privateKeyToAccount("0x" + process.env.HMY_PRIVATE_KEY as string);
  web3.eth.accounts.wallet.add(hmyMasterAccount);
  web3.eth.defaultAccount = hmyMasterAccount.address

  const contract = new web3.eth.Contract(AMA.abi as AbiItem[], config.AMA_CONTRACT_ADDRESS)
  return { contract, account: web3.eth.defaultAccount }
}

export {
  getContract
}