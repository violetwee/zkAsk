import React, { useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import PostQuestionForm from "./PostQuestionForm"
import ListQuestions from "./ListQuestions"
import { getStatusName, getSessionName }  from "../lib/utils"
import { ArrowClockwise } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  Button,
  Table
} from "reactstrap";

export default function ListOwnerAma() {
  const [sessions, setSessions] = React.useState(null)
  const [hasJoined, setHasJoined] = React.useState(false)
  const [sessionId, setSessionId] = React.useState(0)
  const [sessionName, setSessionName] = React.useState("")

  useEffect(() => {
    loadAmaSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAmaSessions = async () => {
      const response = await fetch(`/api/sessions`, {
        method: 'GET'
      })
      let result = await response.json()

    if (response.status === 500) {
        console.log("Error: ", response)
    } else {
        console.log("AMA sessions fetched")
        const MAX_DESC_LENGTH = 100;
        result.map((r: { statusName: string; status: any; description: string }) => {
          r.statusName = getStatusName(r.status) // show status name instead of id
          r.description = r.description.length > MAX_DESC_LENGTH ? r.description.substring(0, MAX_DESC_LENGTH) + '...' : r.description // show snippet of description
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
    const res = await fetch(`/api/session/join/${sessionId}`, options);

    if (res.status === 500) {
      console.log(res)
      const errorMessage = await res.text()
      console.log(errorMessage)
      toast.error(errorMessage);
    } else {
        // setLogs("Your anonymous greeting is onchain :)")
        console.log("Joined AMA session successfully")
        setSessionId(sessionId)
        setHasJoined(true)
        setSessionName(getSessionName(sessionId, sessions))
        toast("Joined AMA session")
    }
  }

  return (
    <div>
      <div className="container p-5">{!hasJoined &&
        <div className="row">
         <div className="col-10">
            <h5 className="display-3">AMA Sessions : Now on Air</h5>
          </div>
          <div className="col-2">
            <Button type="button" className="btn btn-primary float-right" onClick={loadAmaSessions}><ArrowClockwise size="24" /></Button>
          </div>
          <div className="col-12 pt-3">
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
        </div>
        }{
        hasJoined && 
        <div className="row">
          <div className="col-12">
          <h1 className="display-3 text-center p-3">{sessionName}</h1>
          <PostQuestionForm sessionId={sessionId} />
          <ListQuestions sessionId={sessionId} />
          </div>
        </div>
      }
      </div>
      <ToastContainer />
    </div>
  );
}