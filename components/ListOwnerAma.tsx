import React from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"

// reactstrap components
import {
  Button,
  Table
} from "reactstrap";

export default function ListOwnerAma() {
  const [data, setData] = React.useState(null)

  const loadAmaSessions = async () => {
    let signer: providers.JsonRpcSigner;
    const provider = (await detectEthereumProvider()) as any
    await provider.request({ method: "eth_requestAccounts" })

    const ethersProvider = new providers.Web3Provider(provider)
    signer = ethersProvider.getSigner()
    await signer.signMessage("Sign this message to access Host features!")

    let owner = await signer.getAddress();
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
        setData(result)
    }
  }

  return (
    <div>
      <h1 className="display-3 text-center p-5">My AMA Sessions</h1>
      <Button className="mb-3" color="primary" onClick={loadAmaSessions}>Load AMAs</Button>
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
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {data && data.map((session, index) => 
            <tr key={session.sessionId}>
              <td>{index+1}</td>
              <td>{session.name}</td>
              <td>{session.description}</td>
              <td>{session.hosts}</td>
              
              <td>{session.status === 1 ? <Button color="success">Start</Button> : session.status === 2 ? 
                <div><Button color="info">Resume</Button> <Button color="danger">End</Button></div>: session.status === 3 ? 
                <div><Button color="warning">Pause</Button> <Button color="danger">End</Button></div>: "Ended"}</td>
            </tr>)}
          </tbody>
        </Table>
      </div>
    </div>
  );
}