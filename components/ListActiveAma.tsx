import React, { useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { AmaSession } from 'interfaces/AmaSession'
import { getStatusName, getSessionName }  from "lib/utils"
import { CircleFill, LockFill } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PostQuestionForm from "./PostQuestionForm"

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardSubtitle,
  CardText,
  FormGroup,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from"reactstrap";

export default function ListActiveAma() {
  const [sessions, setSessions] = React.useState([])
  const [hasJoined, setHasJoined] = React.useState(false)
  const [reqAccessCode, setReqAccessCode] = React.useState(false)
  const [sessionId, setSessionId] = React.useState(0)
  const [sessionName, setSessionName] = React.useState("")
  const [accessCode, setAccessCode] = React.useState("");

  // access code input
  const handleInputChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setAccessCode(value)
  };

  // fetch all active/paused AMA Sessions
  // participants can only join AMA sessions that are active/paused
  const loadAmaSessions = async () => {
      const response = await fetch(`/api/sessions`, {
        method: 'GET'
      })
      let result = await response.json()

    if (response.status === 500) {
        console.log("loadAmaSessions err: ", response)
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

  // add participant to AMA session (an AMA session is a Semaphore Group)
  const handleJoin = async (sessionId : number, accessCode: string) => {
    console.log("handle join for = ", sessionId, accessCode)

   
    const provider = (await detectEthereumProvider()) as any
    if (!provider) {
      toast("Please install MetaMask and try again!")
      return;
    }
    await provider.request({ method: "eth_requestAccounts" })
    toast("Create your Semaphore identity...")
    const ethersProvider = new providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    const message = await signer.signMessage('Sign this message to create your identity!')

    const identity = new ZkIdentity(Strategy.MESSAGE, message)
    const identityCommitment = identity.genIdentityCommitment()

    const data = JSON.stringify({
      identityCommitment: identityCommitment.toString(),
      accessCode: accessCode || ""
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
      const errorMessage = await res.text()
      toast.error(errorMessage);
    } else {
      setSessionId(sessionId)
      setHasJoined(true)
      setReqAccessCode(false);
      setSessionName(getSessionName(sessionId, sessions))
    }
  }

  // prompt participant for access code to join the AMA session
  const requestAccessCode = (sessionId: number) => {
    setSessionId(sessionId)
    setSessionName(getSessionName(sessionId, sessions))
    setReqAccessCode(true); // show request access code modal
  }

  // dismiss request access code modal
  const closeModal = () => {
    setReqAccessCode(false) // dismiss modal
  }

  // load AMA sessions on page load
  useEffect(() => {
    loadAmaSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="container pt-6 pb-5">{!hasJoined &&
        <div className="row">
          <div className="col-12 text-center mb-3">
            <h5 className="display-3">AMA Sessions</h5>
            <Button className="btn btn-success" onClick={loadAmaSessions}>
              Now on Air <CircleFill size="10" className="blink mb-1 ml-1" style={{color: "red"}} />
            </Button>
          </div>
          <div className="row pt-3 pb-3">
          {sessions && sessions.map((session : AmaSession, index: number) => 
            <div className="col-12" key={session.session_id}>
              <Card outline className="mb-4 shadow">
              <CardHeader>
                <div className="row">
                  <div className="h5 col-md-8 col-sm-12 font-weight-bold">{session.name} {session.req_access_code ? <LockFill className="mb-1" size="16" opacity="0.4" /> : ''}</div>
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
                  <Button color="primary" onClick={() => session.req_access_code ? requestAccessCode(session.session_id) : handleJoin(session.session_id, "")}>JOIN</Button>
                </CardBody>
              </Card>
            </div>
            )}
          </div>
        </div>
        }{
        hasJoined && 
        <div className="row">
          <div className="col-12">
          <div className="display-4 text-center p-3">{sessionName}</div>
          <PostQuestionForm sessionId={sessionId} />
          </div>
        </div>
      }
      </div>

      <Modal centered
        size="md"
        isOpen={reqAccessCode} 
      >
        <ModalHeader toggle={function noRefCheck(){}} close={<button className="close" onClick={() => closeModal()}>×</button>}>
          {sessionName}
        </ModalHeader>
        <ModalBody>
          <div className="pb-3">
            This AMA session requires an access code to join. If you do not have an access code, please contact the host.
          </div>
          <FormGroup>
            <Input
                id="accessCode"
                name="accessCode"
                placeholder="Enter access code"
                type="password" 
                value={accessCode}
                onChange={handleInputChange} 
                autoFocus
              />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => handleJoin(sessionId, accessCode)}
          >
            JOIN NOW
          </Button>
          {' '}
          <Button onClick={() => closeModal()}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      <ToastContainer />
    </div>
  );
}