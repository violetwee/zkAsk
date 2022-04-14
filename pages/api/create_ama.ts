import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers, utils } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"
import excuteQuery from '../../lib/db'

// This API can represent a backend.
// The contract owner is the only account that can call the `greet` function,
// However they will not be aware of the identity of the users generating the proofs.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(req.body);
    const { title, host, desc, accessCode } = req.body;

    const contract = new Contract("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", AMA.abi)
    const provider = new providers.JsonRpcProvider("http://localhost:8545")

    const contractOwner = contract.connect(provider.getSigner())

    try {
        // save ama session to off-chain database
        const result = await excuteQuery({
            query: 'INSERT INTO ama_sessions (title, hosts, description, created_at) VALUES (?, ?, ?, ?)',
            values: [title, host, desc, Date.now() / 1000]
        });
        console.log("result", result);

        // save session id on-chain 

        // await contractOwner.createAmaSession(utils.formatBytes32String(greeting), nullifierHash, solidityProof)
        let accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));
        console.log("code hash = ", accessCodeHash);
        let transaction = await contractOwner.createAmaSession(result.insertId, accessCodeHash);
        console.log(transaction);

        res.status(200).end()
    } catch (error: any) {
        // const { message } = JSON.parse(error.body).error
        // const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))
        console.log(error)

        res.status(500).send("Error" || "Unknown error!")
    }
}
