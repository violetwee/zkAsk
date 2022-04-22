import React, { useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, genExternalNullifier, MerkleProof, Semaphore } from "@zk-kit/protocols"
import { AmaQuestion } from '../interfaces/AmaQuestion'
import { ArrowClockwise } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  Button,
  Table
} from "reactstrap";

type Props = {
  sessionId: number
  shouldReloadQuestions: boolean
}

export default function ListQuestions({ sessionId, shouldReloadQuestions }: Props) {
  const [questions, setQuestions] = React.useState([])  

  // load all questions for selected session id
  const loadQuestions = async () => {
    console.log("loadQuestions for sessionId: ", sessionId)

    const response = await fetch(`/api/questions/${sessionId}`, {
      method: 'GET'
    })
    let result = await response.json()

    if (response.status === 500) {
        toast.error("Failed to load AMA questions")
    } else {
        setQuestions(result)
    }
  }

  // submit vote for a selected question
  // participant cannot vote for his/her questions
  // participant can only vote once for each question
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
    let merkleProof : MerkleProof
    try {
      merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)
    } catch(error: any) {
      toast.error("Join the AMA session before voting on a question")
      return
    }
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
      const errorMessage = await res.text()
      toast.error(errorMessage);
    } else {
      loadQuestions()
      toast("Vote submitted onchain")
    }
  }

  // reload questions list when shouldReloadQuestions = true
  useEffect(() => {
    loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReloadQuestions]);

  return (
    <div>
      <div className="container">
        <div className="row align-items-start pt-5 pb-3">
          <div className="col">
            <h5>Questions {questions ? "(" + questions.length + ")" : ""}</h5>
          </div>
          <div className="col">
            <Button type="button" className="btn btn-primary float-right" onClick={loadQuestions}><ArrowClockwise size="24" /></Button>
          </div>
        </div>
      </div>
      <div>
        <Table> 
          <tbody>
            {questions && questions.map((q: AmaQuestion, index: number) => 
            <tr key={q.question_id}>
              <td>{index+1}</td>
              <td>{q.content} {q.votes > 0 ? "(" + q.votes + ")" : ""}</td>
              <td align="right">
                <Button color="primary" onClick={() => handleVote(sessionId, q.question_id)}>VOTE</Button>
              </td>
            </tr>)}
          </tbody>
        </Table>
      </div>
      <ToastContainer />
    </div>
  );
}