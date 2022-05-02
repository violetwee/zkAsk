import React from "react"
import Header from "../components/Header"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

export default function About() {
  return (
    <div>
      <Header />
      <Navbar />
      <div className="container">
        <div className="row">
          <div className="col-12 text-center display-4 p-5">
            What is zkAsk?
          </div>
          <div className="col-12 pl-5 pr-5">
            <p>
              zkAsk allows an AMA host to create sessions where the audience/participants can join and ask questions anonymously, creating an open and safe environment. Audiences/Participants can also vote anonymously for questions to be answered (community moderation via anonymous voting).
            </p>
            <p>It leverages on Semaphore and zero-knowledge proofs to preserve the user’s identity.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}