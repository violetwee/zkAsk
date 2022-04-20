import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { utils } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../lib/db'
import { CONSTANTS } from '../../../lib/constants'
import { AbiItem } from 'web3-utils'
import Web3 from 'web3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("body: ", req.body);
    const { name, host, desc, accessCode, owner } = req.body;

    // const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi)
    // const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
    // const contractOwner = contract.connect(provider.getSigner())

    const web3 = new Web3(process.env.HARMONY_WSS_URL as string);

    let hmyMasterAccount = web3.eth.accounts.privateKeyToAccount("0x" + process.env.HARMONY_PRIVATE_KEY as string);
    web3.eth.accounts.wallet.add(hmyMasterAccount);
    web3.eth.defaultAccount = hmyMasterAccount.address

    const myAddress = web3.eth.defaultAccount;
    console.log('My address: ', myAddress);

    const contract = new web3.eth.Contract(AMA.abi as AbiItem[], CONSTANTS.AMA_CONTRACT_ADDRESS)

    try {
        // save ama session to off-chain database
        let accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));
        const result = await excuteQuery({
            query: 'INSERT INTO ama_sessions (name, hosts, description, created_at, owner, access_code_hash) VALUES (?, ?, ?, ?, ?, ?)',
            values: [name, host, desc, Math.floor(Date.now() / 1000), owner, accessCodeHash]
        });

        console.log(result)
        if (result && result.insertId) {
            // save session id on-chain 
            // await contract.createAmaSession(result.insertId);
            await contract.methods.createAmaSession(result.insertId).send({ from: web3.eth.defaultAccount, gas: 6721900 });

            res.status(200).end()
        } else {
            console.log("Unable to create AMA session")
            res.status(500).send(result)
        }

    } catch (error: any) {
        console.log("create err: ", error)
        res.status(500).send(error)
    }
}
