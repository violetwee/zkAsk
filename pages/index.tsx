import detectEthereumProvider from "@metamask/detect-provider"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { providers } from "ethers"
import Head from "next/head"
import React from "react"
import styles from "../styles/Home.module.css"
import CreateAmaForm from "./CreateAmaForm"

export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet to join an AMA session!")

    // create AMA session
    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
        const formData = new FormData(event.currentTarget);
        console.log(formData)

        // for (let [key, value] of formData.entries()) {
        //     console.log(key, value);
        //   }

        console.log(event.target)
        event.preventDefault();

        
        // let { title, host, desc, accessCode } = formData;
        // const data = JSON.stringify({
        //     title: title,
        //         host: host,
        //         desc: desc,
        //         accessCode: accessCode
        // })
        // const endpoint = '/api/create_ama';

        // const options = {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //     body: data,
        //   }
      
        //   const response = await fetch(endpoint, options)
        //   const result = await response.json()
        //   console.log("result", result)

        // if (response.status === 500) {
        //     const errorMessage = await response.text()

        //     setLogs(errorMessage)
        // } else {
        //     setLogs("AMA session created and saved to database")
        // }
    }


    async function greet() {
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Sign this message to create your identity!")

        const identity = new ZkIdentity(Strategy.MESSAGE, message)
        const identityCommitment = identity.genIdentityCommitment()
        const identityCommitments = await (await fetch("./identityCommitments.json")).json()

        const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

        setLogs("Creating your Semaphore proof...")

        const greeting = "Hello world"

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            merkleProof.root,
            greeting
        )

        const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/greet", {
            method: "POST",
            body: JSON.stringify({
                greeting,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()

            setLogs(errorMessage)
        } else {
            setLogs("Your anonymous greeting is onchain :)")
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Greetings</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Greetings</h1>

                <p className={styles.description}>A simple Next.js/Hardhat privacy application with Semaphore.</p>

                <div className={styles.logs}>{logs}</div>

                <div onClick={() => greet()} className={styles.button}>
                    Greet
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="title">Title:</label>
                    <input type="text" id="title" name="title" required />
                    <label htmlFor="desc">Description:</label>
                    <input type="text" id="desc" name="desc" />
                    <label htmlFor="host">Host(s):</label>
                    <input type="text" id="host" name="host" />
                    <label htmlFor="accessCode">Access Code:</label>
                    <input type="text" id="accessCode" name="accessCode" />
                    <button type="submit">Create AMA</button>

                </form>

                <CreateAmaForm/>
            </main>
        </div>
    )
}
