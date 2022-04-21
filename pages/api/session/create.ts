import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from 'lib/db'
import { utils } from "ethers"
import { getContract } from 'lib/contract'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("body: ", req.body);
    const { name, host, desc, accessCode, owner } = req.body;
    const { contract, account } = await getContract()

    try {
        // save ama session to off-chain database
        let accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));
        const result = await excuteQuery({
            query: 'INSERT INTO ama_sessions (name, hosts, description, created_at, owner, access_code_hash) VALUES (?, ?, ?, ?, ?, ?)',
            values: [name, host, desc, Math.floor(Date.now() / 1000), owner, accessCodeHash]
        });


        if (result && result.insertId) {
            console.log("Session Id: ", result.insertId)
            // save session id on-chain 
            await contract.methods.createAmaSession(result.insertId).send({ from: account, gas: 6721900 });

            res.status(200).end()
        } else {
            res.status(500).send(result)
        }

    } catch (error: any) {
        res.status(500).send(error)
    }
}
