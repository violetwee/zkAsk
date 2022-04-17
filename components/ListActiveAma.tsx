import React from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import PostQuestionForm from "./PostQuestionForm"
import ListQuestions from "./ListQuestions"
import { getStatusName, getSessionName }  from "../lib/utils"

import {
  Button,
  Table
} from "reactstrap";

export default function ListOwnerAma() {
  const [sessions, setSessions] = React.useState(null)
  const [hasJoined, setHasJoined] = React.useState(false)
  const [sessionId, setSessionId] = React.useState(0)
  const [sessionName, setSessionName] = React.useState("")

  const loadAmaSessions = async () => {
      const response = await fetch(`/api/sessions`, {
        method: 'GET'
      })
      let result = await response.json()

    if (response.status === 500) {
        console.log("Error: ", response)
    } else {
        console.log("AMA sessions fetched")
        result.map((r: { statusName: string; status: any; }) => {
          r.statusName = getStatusName(r.status)
        })
        setSessions(result)
    }
  }

  const handleJoin = async (sessionId : number) => {
    console.log("handle join for = ", sessionId)

    // setLogs("Creating your Semaphore identity...")

    const provider = (await detectEthereumProvider()) as any
    await provider.request({ method: "eth_requestAccounts" })

    const ethersProvider = new providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    const message = await signer.signMessage('Sign this message to create your identity!')

    const identity = new ZkIdentity(Strategy.MESSAGE, message)
    const identityCommitment = identity.genIdentityCommitment()

    const data = JSON.stringify({
      identityCommitment: identityCommitment.toString()
    })
    const options = {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: data
    }
    const response = await fetch(`/api/session/join/${sessionId}`, options);

    if (response.status === 500) {
      console.log(response)
        // const errorMessage = await response.text()

        // setLogs(errorMessage)
    } else {
        // setLogs("Your anonymous greeting is onchain :)")
        console.log("Joined AMA session successfully")
        setSessionId(sessionId)
        setHasJoined(true)
        setSessionName(getSessionName(sessionId, sessions))
    }
  }

  return (
    <div>
      <h1 className="display-3 text-center p-5">AMA Sessions : Now on Air</h1>
      <Button className="mb-3" color="primary" onClick={loadAmaSessions}>Load AMA Sessions</Button>
      <div>
        <Table>
          <thead>
            <tr>
              <th>
                #
              </th>
              <th>
                Name
              </th>
              <th>
                Description
              </th>
              <th>
                Host
              </th>
              <th>
                Status
              </th>
              <th>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions && sessions.map((session: { sessionId: React.ChangeEvent<HTMLInputElement> | React.Key | null | undefined; name: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; description: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; hosts: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; statusName: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; }, index: number) => 
            <tr key={session.sessionId}>
              <td>{index+1}</td>
              <td>{session.name}</td>
              <td>{session.description}</td>
              <td>{session.hosts}</td>
              <td>{session.statusName}</td>
              <td><Button color="success" onClick={() => handleJoin(session.sessionId)}>JOIN</Button></td>
            </tr>)}
          </tbody>
        </Table>
      </div>
      {
        hasJoined && 
        <div>
          <h1 className="display-3 text-center p-3">{sessionName}</h1>
          <PostQuestionForm sessionId={sessionId} />
          <ListQuestions sessionId={sessionId} />
        </div>
      }
    </div>
  );
}