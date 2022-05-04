import Web3 from 'web3'
import config from './config.json'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { AbiItem } from 'web3-utils'

const getContract = async () => {
  let env = process.env.NODE_ENV;

  // set RPC URL and PTE KEY based on env
  const RPC_URL = env == "development" ? process.env.HMY_TESTNET_WSS_URL : process.env.HMY_MAINNET_WSS_URL
  const PTE_KEY = env == "development" ? "0x" + process.env.HMY_PRIVATE_KEY : "0x" + process.env.HMY_PRIVATE_KEY_MAINNET

  console.log(RPC_URL)

  const web3 = new Web3(RPC_URL as string);
  web3.eth.handleRevert = true // return custom error messages from contract

  let hmyMasterAccount = web3.eth.accounts.privateKeyToAccount(PTE_KEY as string);
  web3.eth.accounts.wallet.add(hmyMasterAccount);
  web3.eth.defaultAccount = hmyMasterAccount.address

  const contract = new web3.eth.Contract(AMA.abi as AbiItem[], config.AMA_CONTRACT_ADDRESS)
  return { contract, account: web3.eth.defaultAccount }
}

export {
  getContract
}