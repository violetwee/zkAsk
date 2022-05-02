import React from "react"
import Header from "../components/Header"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

export default function HowItWorks() {
  return (
    <div>
      <Header />
      <Navbar />
      <div className="container">
        <div className="row">
          <div className="col-12 text-center display-4 p-5">
            How it Works
          </div>
          <div className="col-12 pl-5 pr-5">
            <p className="h5">Hosts</p>
            <p>
              An AMA host creates an AMA session, which can be secured with an access code if it is for a private setting (for employees, for verified students etc). Start the AMA session when you are ready to accept questions from participants. Once you are ready to answer questions, you may pause the session. In paused mode, participants are able to join the session to view the questions but are not able to post new questions. 
            </p>
            <p>
              Hosts may answer questions via online voice channels such as Discord, Twitter Spaces, YouTube live streams, or even face-to-face sessions at events and conferences, and use zkAsk to accept questions anonymously.
            </p>
            <p className="h5">Participants</p>
            <p>
              A participant may join an AMA session on the home page. If it is a secured session, the participant will be prompted for the access code. Once verified, the participant may post questions and/or vote for other participants&apos; questions. 
            </p>
            <div>
              <div className="h5">Demo Video (YouTube)</div>
              <a href="https://www.youtube.com/watch?v=LbdWAydgKjQ" target="_blank" rel="noreferrer">zkAsk Demo Video</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}