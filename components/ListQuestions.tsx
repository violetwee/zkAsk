import React, { useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { providers } from "ethers"
import  getStatusName  from "../lib/utils"
import { ArrowClockwise } from 'react-bootstrap-icons';

import {
  Button,
  Table
} from "reactstrap";

export default function ListQuestions({sessionId}) {
  const [questions, setQuestions] = React.useState(null)
  useEffect(() => {
    loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestions = async () => {
    console.log("loadQuestions for sessionId: ", sessionId)

    const response = await fetch(`/api/questions/${sessionId}`, {
      method: 'GET'
    })
    let result = await response.json()
    console.log(result)

    if (response.status === 500) {
        console.log("Error: ", response)
    } else {
        console.log("AMA questions fetched")
        setQuestions(result)
    }
  }

  return (
    <div>
      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
        <Button type="button" className="mb-3" outline onClick={loadQuestions}><ArrowClockwise/></Button>
      </div>
      
      <div>
        <Table>
          <tbody>
            {questions && questions.map((q, index: number) => 
            <tr key={q.questionId}>
              <td>{index+1}</td>
              <td>{q.content}</td>
              
              <td align="right"><Button color="primary">VOTE</Button></td>
            </tr>)}
          </tbody>
        </Table>
      </div>
      
    </div>
  );
}