import React, { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"

// reactstrap components
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
  name: "My AMA",
  desc: "AMA stuffs",
  host: "Me",
  accessCode: ""
};

export default function CreateAmaForm() {
  const [values, setValues] = useState(initialValues);

  const handleInputChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    console.log(event)
    const { name, value } = event.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = async (event : React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const provider = (await detectEthereumProvider()) as any

    await provider.request({ method: "eth_requestAccounts" })

    const ethersProvider = new providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    await signer.signMessage("Sign this message to create your AMA session!")

    let owner = await signer.getAddress();
    const { name, desc, host, accessCode } = values;

    const data = JSON.stringify({
        name: name,
        host: host,
        desc: desc,
        accessCode: accessCode,
        owner: owner
    })
    console.log(data)
    const endpoint = '/api/session/create';

    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      }
  
      const response = await fetch(endpoint, options)
      // const result = await response.json()
      console.log("response", response)

    if (response.status === 500) {
        const errorMessage = await response.text()
        console.log(errorMessage)
    } else {
        console.log("AMA session created and saved to database")
    }
  }

  return (
    <div>
      <h1 className="display-3 text-center p-5">Create an AMA Session</h1>
    
        <Form onSubmit={handleSubmit}>
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
                <Button color="primary" type="submit">
                  Create AMA Session
                </Button>
              </FormGroup>
            </Col>
          </Row>
        </Form>
        </div>
  );
}