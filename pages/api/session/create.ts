import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers, utils } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("body: ", req.body);
    const { name, host, desc, accessCode, owner } = req.body;

    const contract = new Contract("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", AMA.abi)
    const provider = new providers.JsonRpcProvider("http://localhost:8545")
    const contractOwner = contract.connect(provider.getSigner())

    try {
        // save ama session to off-chain database
        const result = await excuteQuery({
            query: 'INSERT INTO ama_sessions (name, hosts, description, created_at, owner) VALUES (?, ?, ?, ?, ?)',
            values: [name, host, desc, Math.floor(Date.now() / 1000), owner]
        });

        console.log(result)
        if (result && result.insertId) {
            // save session id on-chain 
            let accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));
            await contractOwner.createAmaSession(result.insertId, accessCodeHash);

            res.status(200).end()
        } else {
            console.log("Unable to create AMA session")
            res.status(500).send(result)
        }

    } catch (error: any) {
        res.status(500).send(error)
    }
}
