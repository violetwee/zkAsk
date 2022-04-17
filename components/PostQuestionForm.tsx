import React, { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, genExternalNullifier, Semaphore } from "@zk-kit/protocols"

import {
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Button
} from "reactstrap";

const initialValues = {
  content: "Is zkSnarks or zkStarks better?"
};

export default function PosQuestionForm({sessionId }) {
  const [values, setValues] = useState(initialValues);

  const handleInputChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = async (event : React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("handle submit:", sessionId)
    const provider = (await detectEthereumProvider()) as any
    await provider.request({ method: "eth_requestAccounts" })

    const ethersProvider = new providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    const message = await signer.signMessage("Sign this message to create your identity!")

    const identity = new ZkIdentity(Strategy.MESSAGE, message)
    const identityCommitment = identity.genIdentityCommitment()

    const { content } = values;
    const signal = "post"

    // insert question into db first, because we need it the questionId as nullifier
    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content
        }),
    }
    const response = await fetch(`/api/question/insert/${sessionId}`, options)
    const questionId = await response.json()

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

    const res = await fetch(`/api/question/post/${sessionId}`, {
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
        console.log("Error", response)
    } else {
        console.log("Question posted onchain!")
        setValues(initialValues)
    }
  }

  return (
    <div className="p-3">
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md="12">
              <FormGroup floating>
                <Input
                  id="content"
                  name="content"
                  type="text" value={values.content}
                  maxLength="500"
                  onChange={handleInputChange} required 
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
          <Col md="12">
            <FormGroup>
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <Button color="primary" type="submit">
                Post Question
              </Button>
            </div>
            </FormGroup>
          </Col>
          </Row>
        </Form>
        </div>
  );
}