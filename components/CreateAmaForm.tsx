import React, { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ReactSession } from 'react-client-session';

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
  name: "",
  desc: "",
  host: "",
  accessCode: ""
};

export default function CreateAmaForm() {
  const [values, setValues] = useState(initialValues);

  const handleInputChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  // create AMA session with form inputs
  const handleCreate = async (event : React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const provider = (await detectEthereumProvider()) as any
    if (!provider) {
      toast("Please install MetaMask and try again!")
      return;
    }
    
    await provider.request({ method: "eth_requestAccounts" })
    const ethersProvider = new providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    await signer.signMessage("Sign this message to create your AMA session!")

    let owner = await signer.getAddress();
    ReactSession.set("owner", owner)
    
    // get session form values
    const { name, desc, host, accessCode } = values;

    const data = JSON.stringify({
        name: name,
        host: host,
        desc: desc,
        accessCode: accessCode,
        owner: owner
    })
    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      }
  
    const res = await fetch('/api/session/create', options)

    if (res.status === 500) {
        const errorMessage = await res.text()
        toast.error(errorMessage);
    } else {
        setValues(initialValues) // reset form values
        toast("AMA session created")
    }
  }

  return (
    <div>
      <div className="container">
        <div className="col">
          <h1 className="display-3 pb-3">Create an AMA Session</h1>
        </div>
        <div className="col">
          <Form onSubmit={handleCreate}>
            <Row>
              <Col md="12">
                <FormGroup floating>
                  <Label for="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="What do you want to call your AMA session?"
                    type="text" value={values.name}
                    onChange={handleInputChange} required
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                <Label for="desc">About</Label>
                <Input
                    id="desc"
                    name="desc"
                    placeholder="What is your AMA session about?"
                    rows="5"
                    type="textarea" value={values.desc}
                    onChange={handleInputChange} required
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                <Label for="host">Host</Label>
                <Input
                    id="host"
                    name="host"
                    placeholder="Who's hosting this AMA?"
                    type="text" value={values.host}
                    onChange={handleInputChange} required
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                <Label for="desc">Access Code</Label>
                <Input
                    id="accessCode"
                    name="accessCode"
                    placeholder="Set an access code if the AMA session is not open to all"
                    type="text" value={values.accessCode}
                    onChange={handleInputChange} 
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
            <Col md="12">
                <FormGroup>
                  <Button className="float-right" color="primary" type="submit">
                    Create
                  </Button>
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}