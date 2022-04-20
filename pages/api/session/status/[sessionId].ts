import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../../lib/db'
import { CONSTANTS } from '../../../../lib/constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
// import { Contract, providers } from "ethers"
import { AbiItem } from 'web3-utils'
import Web3 from 'web3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("body: ", req.body);
  const { command } = req.body;
  const {
    query: { sessionId }
  } = req

  // const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
  // const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, provider.getSigner())
  // let owner = contract.connect(provider.getSigner())

  var provider = new Web3.providers.WebsocketProvider(process.env.HARMONY_WSS_URL as string);
  const web3 = new Web3(provider);

  let hmyMasterAccount = web3.eth.accounts.privateKeyToAccount("0x" + process.env.HARMONY_PRIVATE_KEY as string);
  web3.eth.accounts.wallet.add(hmyMasterAccount);
  web3.eth.defaultAccount = hmyMasterAccount.address

  const myAddress = web3.eth.defaultAccount;
  console.log('My address: ', myAddress);

  const contract = new web3.eth.Contract(AMA.abi as AbiItem[], CONSTANTS.AMA_CONTRACT_ADDRESS)

  // update status onchain based on current status
  try {
    switch (command) {
      case "start":
        // await owner.startAmaSession(sessionId);
        await contract.methods.startAmaSession(sessionId).send({ from: web3.eth.defaultAccount, gas: 6721900 })
        await excuteQuery({
          query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
          values: [CONSTANTS.ACTIVE, sessionId]
        });
        break;
      case "pause":
        // await owner.pauseAmaSession(sessionId);
        await contract.methods.pauseAmaSession(sessionId).send({ from: web3.eth.defaultAccount, gas: 6721900 });
        await excuteQuery({
          query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
          values: [CONSTANTS.PAUSED, sessionId]
        });
        break;
      case "resume":
        // await owner.resumeAmaSession(sessionId);
        await contract.methods.resumeAmaSession(sessionId).send({ from: web3.eth.defaultAccount, gas: 6721900 });
        await excuteQuery({
          query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
          values: [CONSTANTS.ACTIVE, sessionId]
        });
        break;
      case "end":
        // await owner.endAmaSession(sessionId);
        await contract.methods.endAmaSession(sessionId).send({ from: web3.eth.defaultAccount, gas: 6721900 });
        await excuteQuery({
          query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
          values: [CONSTANTS.ENDED, sessionId]
        });
        break;
      default: console.log("Invalid command")
    }
    res.status(200).end()
  } catch (error: any) {
    console.log("Update status error", error)
    res.status(500).send(error)
  }

  // listen for onchain event
  // if onchain updated successfully, update status offchain
  // contract.on("AmaSessionStatusChanged", async (sId, statusId) => {
  //   console.log("AmaSessionStatusChanged: ", sId.toNumber(), statusId.toNumber())
  //   await excuteQuery({
  //     query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
  //     values: [statusId.toNumber(), sessionId]
  //   });
  // })

  // contract.events.AmaSessionStatusChanged((err, txn) => {
  //   console.log("AmaSessionStatusChanged")
  //   console.log(err)
  //   console.log(txn)
  //   if (!err) {
  //     let { returnValues } = txn
  //     console.log("returnValues = ", returnValues)
  //     console.log("result", returnValues.Result)
  //     console.log("statusId", returnValues.statusId)

  //     excuteQuery({
  //       query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
  //       values: [returnValues.statusId.toNumber(), sessionId]
  //     });
  //   }
  // })

  // contract.events.allEvents({ fromBlock: 0 }, function (err, txn) {
  //   console.log("AmaSessionStatusChanged")
  //   console.log(err)
  //   console.log(txn)
  //   if (!err) {
  //     let { returnValues } = txn
  //     console.log("returnValues = ", returnValues)
  //     console.log("result", returnValues.Result)
  //     console.log("statusId", returnValues.statusId)

  //     excuteQuery({
  //       query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
  //       values: [returnValues.statusId.toNumber(), sessionId]
  //     });
  //   }
  // });


  // contract.events.AmaSessionStatusChanged({
  //   // filter: { sessionId: [sessionId] },
  //   fromBlock: 0,
  //   toBlock: 'latest'
  // }).on('data', function (event) {
  //   console.log(event.returnValues);
  //   console.log(event.returnValues["statusId"])
  //   let sessionId = event.returnValues["sessionId"]
  //   let statusId = event.returnValues["statusId"]
  //   console.log(statusId)
  //   excuteQuery({
  //     query: 'UPDATE ama_sessions SET status = ? WHERE session_id = ?',
  //     values: [statusId, sessionId]
  //   });
  // }).on('error', console.error);

  // contract.getPastEvents('AmaSessionStatusChanged', {
  //   // filter: {myIndexedParam: [20,23], myOtherIndexedParam: '0x123456789...'}, // Using an array means OR: e.g. 20 or 23
  //   fromBlock: 0,
  //   toBlock: 'latest'
  // }, function (error, events) { console.log(error, events); })
  //   .then(function (events) {
  //     console.log(events) // same results as the optional callback above
  //   });

}