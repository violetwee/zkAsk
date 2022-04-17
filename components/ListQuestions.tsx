import React, { useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, genExternalNullifier, Semaphore } from "@zk-kit/protocols"
import { ArrowClockwise } from 'react-bootstrap-icons';

import {
  Button,
  Table
} from "reactstrap";

export default function ListQuestions({sessionId}) {
  const [questions, setQuestions] = React.useState(null)
  useEffect(() => {
    loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestions = async () => {
    console.log("loadQuestions for sessionId: ", sessionId)

    const response = await fetch(`/api/questions/${sessionId}`, {
      method: 'GET'
    })
    let result = await response.json()
    console.log(result)

    if (response.status === 500) {
        console.log("Error: ", response)
    } else {
        console.log("AMA questions fetched")
        setQuestions(result)
    }
  }

  const handleVote = async (sessionId: number,  questionId: number) => {
    // event.preventDefault();
    console.log("handle vote:", sessionId, questionId)
    const provider = (await detectEthereumProvider()) as any
    await provider.request({ method: "eth_requestAccounts" })

    const ethersProvider = new providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    const message = await signer.signMessage("Sign this message to create your identity!")

    const identity = new ZkIdentity(Strategy.MESSAGE, message)
    const identityCommitment = identity.genIdentityCommitment()

    const signal = "vote"

    // fetch all identity commitments from session so that we can generate proofs
    const identityCommitments = await(await fetch(`/api/session/identity/${sessionId}`, {
      method: 'GET'
    })).json()

    // generate proofs
    const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)
    const nullifier = `${sessionId}_${questionId}`;
    const questionNullifier = Semaphore.genNullifierHash(genExternalNullifier(nullifier), identity.getNullifier())

    const witness = Semaphore.genWitness(
        identity.getTrapdoor(),
        identity.getNullifier(),
        merkleProof,
        questionNullifier,
        signal
    )

    const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
    const solidityProof = Semaphore.packToSolidityProof(proof)

    const res = await fetch(`/api/question/vote/${sessionId}`, {
        method: "POST",
        body: JSON.stringify({
            questionId,
            root: (merkleProof.root).toString(),
            nullifierHash: publicSignals.nullifierHash,
            externalNullifier: publicSignals.externalNullifier,
            solidityProof: solidityProof
        })
    })

    if (res.status === 500) {
        console.log("Error", res)
    } else {
        console.log("Question voted onchain!")
        loadQuestions()
    }
  }

  return (
    <div>
      <div className="container">
        <div className="row align-items-start pt-3 pb-3">
          <div className="col">
          <h5 className="">Questions {questions ? "(" + questions.length + ")" : ""}</h5>
          </div>
          <div className="col">
          <Button type="button" className="btn btn-primary float-right" onClick={loadQuestions}><ArrowClockwise size="24" /></Button>
          </div>
        </div>
      </div>
      
      <div>
        <Table> 
          <tbody>
            {questions && questions.map((q, index: number) => 
            <tr key={q.questionId}>
              <td>{index+1}</td>
              <td>{q.content} {q.votes > 0 ? "(" + q.votes + ")" : ""}</td>
              <td align="right"><Button color="primary" onClick={() => handleVote(sessionId, q.questionId)}>VOTE</Button></td>
            </tr>)}
          </tbody>
        </Table>
      </div>
      
    </div>
  );
}