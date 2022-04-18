import React, { useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import  { getStatusName }  from "../lib/utils"
import { ArrowClockwise } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  Button,
  Table,
} from "reactstrap";

export default function ListOwnerAma() {
  const [sessions, setSessions] = React.useState(null)
  const [sessionData, setSessionData] = React.useState(null)
  let ownerAddress : string;

  useEffect(() => {
    loadOwnerAmaSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOwnerAmaSessions = async () => {
    let signer: providers.JsonRpcSigner;
    const provider = (await detectEthereumProvider()) as any
    await provider.request({ method: "eth_requestAccounts" })

    const ethersProvider = new providers.Web3Provider(provider)
    signer = ethersProvider.getSigner()
    await signer.signMessage("Sign this message to access Host features!")

    ownerAddress = await signer.getAddress()
    

    console.log("owner is ", ownerAddress)
    const endpoint = `/api/sessions/${ownerAddress}`;

    const options = {
        method: 'GET'
      }
  
      const res = await fetch(endpoint, options)
      let result = await res.json()

    if (res.status === 500) {
        // const errorMessage = await res.text()
        // console.log(errorMessage)
        console.log(res)
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

  const handleView = async (sessionId : number) => {
    console.log("handle view for = ", sessionId)
    const endpoint = `/api/session/${sessionId}`;

    const options = {
      method: 'GET'
    }
  
    const res = await fetch(endpoint, options)
      
    if (res.status === 500) {
        const errorMessage = await res.text()
        console.log(errorMessage)
    } else {
        console.log("AMA sessions fetched")
        let result = await res.json()
        console.log("session data = ", result)

        result.statusName = getStatusName(result.status)
        setSessionData(result)
    }
  }

  const handleStatus = async ( sessionId: number, command: string) => {
    console.log("handle status change: for ", sessionId, command, ownerAddress)
    const endpoint = `/api/session/status/${sessionId}`;

    const options = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command })
      }
  
      const res = await fetch(endpoint, options)
      
    if (res.status === 500) {
        console.log("Error:", res)
        toast.error("Failed to update session status")
    } else {
        console.log("AMA session status updated", res)
        // refresh page with updated data
        toast("Updating status...", {
          onClose: async () => {
            await loadOwnerAmaSessions()
            await handleView(sessionId)
          }
        })
    }
  }

  return (
    <div>
      <div className="container">
        <div className="row pt-3 pb-3">
          <div className="col-10">
          <h5 className="display-3">My AMA Sessions {sessions ? "(" + sessions.length + ")" : ""}</h5>
          </div>
          <div className="col-2">
          <Button type="button" className="btn btn-primary float-right" onClick={loadOwnerAmaSessions}><ArrowClockwise size="24" /></Button>
          </div>
        </div>
        <div className="row">
          <div className="col">
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
                {sessions && sessions.map((session, index) => 
                <tr key={session.sessionId}>
                  <td>{index+1}</td>
                  <td>{session.name}</td>
                  <td>{session.description}</td>
                  <td>{session.hosts}</td>
                  <td>{session.statusName}</td>
                  <td><Button color="info" onClick={() => handleView(session.sessionId)}>VIEW</Button></td>
                </tr>)}
              </tbody>
            </Table>
              {/* Session data */}
              <div>
                {sessionData &&
                  <div>
                    <div className="container">
                      <div className="row">
                        <div className="col-12">
                        <div className="card">
                        <div className="card-header">
                          
                        </div>
                          <div className="card-body">
                            <h5 className="card-title">{sessionData.name}</h5>
                            <h6 className="card-subtitle mb-2 text-muted">Hosted by: {sessionData.hosts}</h6>
                            <p className="card-text">{sessionData.description}</p>
                            {sessionData.status === 1 ? <Button color="success" onClick={() => handleStatus(sessionData.sessionId, 'start')}>Start</Button> : sessionData.status === 2 ? 
                              <div><Button onClick={() => handleStatus(sessionData.sessionId, 'resume')} color="info">Resume</Button> <Button onClick={() => handleStatus(sessionData.sessionId, 'end')} color="danger">End</Button></div>: sessionData.status === 3 ? 
                              <div><Button onClick={() => handleStatus(sessionData.sessionId, 'pause')} color="warning">Pause</Button> <Button onClick={() => handleStatus(sessionData.sessionId, 'end')}  color="danger">End</Button></div>: <Button disabled color="secondary">Ended</Button>}
                          </div>
                        </div>

                        </div>
                      </div>
                    </div>

                    
                    
                  </div>
                }
              </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}