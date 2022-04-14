import React, { useState } from "react";

const initialValues = {
  title: "",
  desc: "",
  host: "",
  accessCode: ""
};

export default function CreateAmaForm() {
  const [values, setValues] = useState(initialValues);
  const [setLogs] = useState("")

  const handleInputChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = async (event : React.FormEvent<HTMLFormElement>) => {
    const { title, desc, host, accessCode } = values;
    event.preventDefault();

    const data = JSON.stringify({
        title: title,
        host: host,
        desc: desc,
        accessCode: accessCode
    })
    console.log(data)
    const endpoint = '/api/create_ama';

    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      }
  
      const response = await fetch(endpoint, options)
      const result = await response.json()
      console.log("result", result)

    if (response.status === 500) {
        const errorMessage = await response.text()
        console.log(errorMessage)
    } else {
        console.log("AMA session created and saved to database")
    }
  }

  return (
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Title:</label>
          <input type="text" id="title" name="title" value={values.title}
            onChange={handleInputChange} required />

          <label htmlFor="desc">Description:</label>
          <input type="text" id="desc" name="desc" value={values.desc}
            onChange={handleInputChange} />

          <label htmlFor="host">Host(s):</label>
          <input type="text" id="host" name="host" value={values.host}
            onChange={handleInputChange} required />

          <label htmlFor="accessCode">Access Code:</label>
          <input type="text" id="accessCode" name="accessCode" value={values.accessCode}
            onChange={handleInputChange} required />

          <button type="submit"> Create AMA Session </button>
        </form>
  );
}