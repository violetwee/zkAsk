import React from "react"
import Header from "../components/Header"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

export default function Faq() {
  return (
    <div>
      <Header />
      <Navbar />
      <div className="container">
        <div className="row">
          <div className="col-12 text-center display-4 p-5">
            Frequently Asked Questions
          </div>
          <div className="col-12 pl-5 pr-5">
            <p className="font-weight-bold">
              I tried to create an AMA session but it says &quot;Please install Metamask and try again!&quot; 
            </p>
            <p>
              zkAsk is built on the Harmony blockchain. Therefore you need a MetaMask wallet to access the blockchain. You may install the MetaMask chrome extension <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en" target="_blank" rel="noreferrer">here</a>. Then, add the Harmony network to MetaMask by following this <a href="https://docs.harmony.one/home/general/wallets/browser-extensions-wallets/metamask-wallet/adding-harmony" target="_blank" rel="noreferrer">guide</a>.
            </p>

            <p className="col-12 font-weight-bold">
              My audience/participants cannot see the AMA session.
            </p>
            <div>
              <ol>
                <li>Go to &quot;I&apos;m a Host&quot;</li>
                <li>Click on the &quot;My AMA Sessions&quot; link </li>
                <li>Check that your AMA session is Started. Otherwise, click Start. </li>
              </ol>
              <p>Once started, your audience/participants can access the AMA session from the home page.</p>
            </div> 

            <p className="font-weight-bold">
              My audience/participant tried to join the AMA session but it says &quot;Please install Metamask and try again!&quot; 
            </p>
            <p>
              zkAsk is built on the Harmony blockchain. Therefore an audience/participant who wants to join an AMA session will need a MetaMask wallet to access the blockchain. Install the MetaMask chrome extension <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en" target="_blank" rel="noreferrer">here</a>. Then, add the Harmony network to MetaMask by following this <a href="https://docs.harmony.one/home/general/wallets/browser-extensions-wallets/metamask-wallet/adding-harmony" target="_blank" rel="noreferrer">guide</a>.
            </p>

            <p className="font-weight-bold">
              How much does it cost to create an AMA session? 
            </p>
            <p>
              The cost is 1 ONE right now. This is to encourage hosts to create AMA sessions on zkAsk, as it is a new project. The cost may change in future, in order to make zkAsk self-sustainable. 
            </p>

            <p className="font-weight-bold">
              Is there a limit to the number of questions for an AMA session? 
            </p>
            <p>
              Yes, each AMA session can accept up to 100 questions.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}