import React, { useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { ethers, providers, BigNumber } from "ethers"
import { AmaSession } from "interfaces/AmaSession";
import { getStatusName }  from "../lib/utils"
import { ArrowClockwise, CircleFill } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ReactSession } from 'react-client-session';
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import config from 'lib/config.json'

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardSubtitle,
  CardText
} from "reactstrap";

export default function ListOwnerAma() {
  const [sessions, setSessions] = React.useState([])
  let ownerAddress : string;

  const loadOwnerAmaSessions = async () => {
    ownerAddress = ReactSession.get("owner");

    if (!ownerAddress) {
      let signer: providers.JsonRpcSigner;
      const provider = (await detectEthereumProvider()) as any
      let accounts = await provider.request({ method: "eth_requestAccounts" })
      ownerAddress = accounts[0];

      const ethersProvider = new providers.Web3Provider(provider)
      signer = ethersProvider.getSigner(ownerAddress)
      await signer.signMessage("Sign this message to load your AMA sessions")

      ReactSession.set("owner", ownerAddress);
    }
  
    const res = await fetch(`/api/sessions/${ownerAddress}`, {
      method: 'GET'
    })
    let result = await res.json()

    if (res.status === 500) {
      console.log(res)
      toast.error("Failed to load AMA sessions")
    } else {
        // parse data for display
        const MAX_DESC_LENGTH = 100;
        result.map((r: { statusName: string; status: any; description: string }) => {
          r.statusName = getStatusName(r.status) // show status name instead of id
          r.description = r.description.length > MAX_DESC_LENGTH ? r.description.substring(0, MAX_DESC_LENGTH) + '...' : r.description // show snippet of description
        })
        setSessions(result)
    }
  }

  // update session status
  const handleStatus = async ( sessionId: number, command: string) => {
    console.log("handle status change: for ", sessionId, command)

    const options = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command })
      }
  
      const res = await fetch(`/api/session/status/${sessionId}`, options)
      
    if (res.status === 500) {
        const errorMessage = await res.text()
        toast.error(errorMessage);
    } else {
      const provider = (await detectEthereumProvider()) as any
    
      await provider.request({ method: "eth_requestAccounts" })
      const ethersProvider = new providers.Web3Provider(provider)
      const signer = ethersProvider.getSigner()
      await signer.signMessage("Sign this message to update session status")

      let contract = new ethers.Contract(config.AMA_CONTRACT_ADDRESS, AMA.abi, signer);
      switch (command) {
        case "start":
          await contract.startAmaSession(BigNumber.from(sessionId))
          break;
        case "pause":
          await contract.pauseAmaSession(BigNumber.from(sessionId))
          break;
        case "resume":
          await contract.resumeAmaSession(BigNumber.from(sessionId))
          break;
        case "end":
          await contract.endAmaSession(BigNumber.from(sessionId))
          break;
        default: console.log("Invalid command")
      }

      // refresh page with updated data
      await loadOwnerAmaSessions()
      toast("Status updated")
    }
  }

  // load host's AMA sessions on page load
  useEffect(() => {
    loadOwnerAmaSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="container">
        <div className="row pt-3 pb-3">
          <div className="col-12 text-center display-4 pb-5">
            My AMA Sessions {sessions ? "(" + sessions.length + ")" : ""}
          </div>
          <div className="col-12">
            <Button type="button" className="btn btn-primary float-right" onClick={loadOwnerAmaSessions}><ArrowClockwise size="24" /></Button>
          </div>
        </div>
        <div className="row">
        {sessions && sessions.map((session : AmaSession, index: number) => 
          <div className="col-12" key={session.session_id}>
            <Card outline className="mb-4 shadow">
            <CardHeader>
              <div className="row">
                <div className="h5 col-md-8 col-sm-12 font-weight-bold">{session.name}</div>
                <div className="col-md-4 col-sm-12 text-md-right">
                  <CircleFill size="8" className={`mr-2 mb-1 ${session.status > 0 ? "status-"+session.status : ""}`} />
                  {session.statusName}
                  </div>
              </div>
            </CardHeader>
              <CardBody>
                <CardSubtitle
                  className="mb-2 text-muted"
                  tag="h6"
                >
                  {session.hosts}
                </CardSubtitle>
                <CardText className="text-dark font-weight-400">
                {session.description}
                </CardText>
                {session.status === 1 ? <Button color="success" onClick={() => handleStatus(session.session_id, 'start')}>Start</Button> : session.status === 2 ? 
                <div><Button onClick={() => handleStatus(session.session_id, 'resume')} color="info">Resume</Button> <Button onClick={() => handleStatus(session.session_id, 'end')} color="danger">End</Button></div>: session.status === 3 ? 
                <div><Button onClick={() => handleStatus(session.session_id, 'pause')} color="warning">Pause</Button> <Button onClick={() => handleStatus(session.session_id, 'end')}  color="danger">End</Button></div>: <Button disabled color="secondary">Ended</Button>}
              </CardBody>
            </Card>
          </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}