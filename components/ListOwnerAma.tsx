import React from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import  getStatusName  from "../lib/utils"
// reactstrap components
import {
  Button,
  Table
} from "reactstrap";
import { CONSTANTS } from "lib/constants";

export default function ListOwnerAma() {
  const [sessions, setSessions] = React.useState(null)
  const [sessionData, setSessionData] = React.useState(null)
  let owner: string;

  const loadAmaSessions = async () => {
    let signer: providers.JsonRpcSigner;
    const provider = (await detectEthereumProvider()) as any
    await provider.request({ method: "eth_requestAccounts" })

    const ethersProvider = new providers.Web3Provider(provider)
    signer = ethersProvider.getSigner()
    await signer.signMessage("Sign this message to access Host features!")

    owner = await signer.getAddress();
    const endpoint = `/api/sessions/${owner}`;

    const options = {
        method: 'GET'
      }
  
      const response = await fetch(endpoint, options)
      let result = await response.json()

    if (response.status === 500) {
        const errorMessage = await response.text()
        console.log(errorMessage)
    } else {
        console.log("AMA sessions fetched")
        result.map((r: { statusName: string; status: any; }) => {
          r.statusName = getStatusName(r.status)
        })
        setSessions(result)
    }
  }

  const handleView = async (sessionId : React.ChangeEvent<HTMLInputElement>) => {
    console.log("handle view for = ", sessionId)
    const endpoint = `/api/session/${sessionId}`;

    const options = {
        method: 'GET'
      }
  
      const response = await fetch(endpoint, options)
      let result = await response.json()
      console.log("session data = ", result)
    if (response.status === 500) {
        const errorMessage = await response.text()
        console.log(errorMessage)
    } else {
        console.log("AMA sessions fetched")

        result.statusName = getStatusName(result.status)
        setSessionData(result)
    }
  }

  const handleStatus = async (status : React.ChangeEvent<HTMLInputElement>) => {
    console.log("handle status change: ", status)
    // const { name } = event.target;
    // console.log(name)
  }


  return (
    <div>
      <h1 className="display-3 text-center p-5">My AMA Sessions</h1>
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
              <td><Button color="success" onClick={() => handleView(session.sessionId)}>VIEW</Button></td>
              {/* <td>{session.status === 1 ? <Button color="success">Start</Button> : session.status === 2 ? 
                <div><Button color="info">Resume</Button> <Button color="danger">End</Button></div>: session.status === 3 ? 
                <div><Button color="warning">Pause</Button> <Button color="danger">End</Button></div>: "Ended"}</td> */}
            </tr>)}
          </tbody>
        </Table>
      </div>
      {/* Session data */}
      <div>
        {sessionData &&
          <div>
            <h1 className="display-3 text-center p-5">{sessionData.name}</h1>
            <h4 className="text-center pb-5">{sessionData.description}</h4>
            <h5 className="text-center">HOSTED BY:</h5>
            <h4 className="text-center">{sessionData.hosts}</h4>

            <div className="text-center p-3">{sessionData.status === 1 ? <Button color="success" onClick={() => handleStatus(sessionData.status)}>Start</Button> : sessionData.status === 2 ? 
                <div><Button onClick={() => handleStatus} color="info">Resume</Button> <Button onClick={() => handleStatus} color="danger">End</Button></div>: sessionData.status === 3 ? 
                <div><Button onClick={() => handleStatus} color="warning">Pause</Button> <Button color="danger">End</Button></div>: <Button disabled color="secondary">Ended</Button>}
            </div>
          </div>
        }
      </div>
    </div>
  );
}