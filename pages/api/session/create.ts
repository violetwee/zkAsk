import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers, utils } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../lib/db'
import { CONSTANTS } from '../../../lib/constants'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("body: ", req.body);
    const { name, host, desc, accessCode, owner } = req.body;

    const contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi)
    const provider = new providers.JsonRpcProvider(CONSTANTS.NETWORK_URL)
    const contractOwner = contract.connect(provider.getSigner())

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
            await contractOwner.createAmaSession(result.insertId);
            res.status(200).end()
        } else {
            console.log("Unable to create AMA session")
            res.status(500).send(result)
        }

    } catch (error: any) {
        res.status(500).send(error)
    }
}
