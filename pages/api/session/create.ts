import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from 'lib/db'
import { utils } from "ethers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { name, host, desc, accessCode, owner } = req.body;

    try {
        // save ama session to off-chain database
        let accessCodeHash: string = "";
        if (accessCode)
            accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));

        const result = await excuteQuery({
            query: 'INSERT INTO ama_sessions (name, hosts, description, created_at, owner, access_code_hash) VALUES (?, ?, ?, ?, ?, ?)',
            values: [name, host, desc, Math.floor(Date.now() / 1000), owner, accessCodeHash == "" ? null : accessCodeHash]
        });

        if (result && result.insertId) {
            // save session id on-chain 
            res.status(200).send(result.insertId)
        } else {
            res.status(500).send(result)
        }

    } catch (error: any) {
        console.log(error)
        res.status(500).send(error.reason || "Failed to create AMA session")
    }
}
