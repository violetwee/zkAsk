import React, { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, genExternalNullifier, Semaphore } from "@zk-kit/protocols"

import {
  FormGroup,
  Label,
  Form,
  Input,
  Row,
  Col,
  Button
} from "reactstrap";

const initialValues = {
  content: "Is zkSnarks or zkStarks better?"
};

export default function PosQuestionForm({sessionId}) {
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

    // insert question into db first, because we need it as nullifier
    const data = JSON.stringify({
      content
    })
    console.log(data)
    const endpoint = `/api/question/insert/${sessionId}`;

    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      }
  
      const response = await fetch(endpoint, options)
      const questionId = await response.json()
      console.log("response", response)
      console.log("result", questionId)

       // fetch all identity commitments from session so that we can generate proof
    const endpointGetIdentityCommitments = `/api/session/identity/${sessionId}`;

    const optionsGetIdentityCommitments = {
        method: 'GET'
      }
  
      const responseGetIdentityCommitments = await fetch(endpointGetIdentityCommitments, optionsGetIdentityCommitments)
      console.log("response", responseGetIdentityCommitments)
      const identityCommitments = await responseGetIdentityCommitments.json()
      console.log(identityCommitments)

      console.log("my identity commitment", identityCommitment)
      const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

      

    const nullifier = `${sessionId}_${questionId}`;
    const externalNullifier = genExternalNullifier(nullifier);
    const questionNullifier = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier())

    console.log("nullifier = ", nullifier)
    console.log("ext nullifier = ", externalNullifier)
    console.log("question nullifier = ", questionNullifier)

    const witness = Semaphore.genWitness(
        identity.getTrapdoor(),
        identity.getNullifier(),
        merkleProof,
        questionNullifier,
        signal
    )

    const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
    const solidityProof = Semaphore.packToSolidityProof(proof)

    console.log("public signals = ", publicSignals)

    console.log("publicSignals.nullifierHash = ", publicSignals.nullifierHash)
    console.log("publicSignals.externalNullifier = ", publicSignals.externalNullifier)
    console.log("solidityProof = ", solidityProof)

    // (sessionId, result.insertId, utils.formatBytes32String("post"), root, nullifierHash, externalNullifier, solidityProof)
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
    }
  }

  return (
    <div>
      <h1 className="display-3 text-center p-5">Post a Question</h1>
    
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md="12">
              <FormGroup floating>
                <Label for="content">Question</Label>
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
                <Button color="primary" type="submit">
                  Post Question
                </Button>
              </FormGroup>
            </Col>
          </Row>
        </Form>
        </div>
  );
}