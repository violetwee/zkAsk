import Head from "next/head"
import React from "react"
import ListActiveAma from "../components/ListActiveAma"
import Navbar from "../components/Navbar"
import Image from 'next/image'
import microphoneImage from '../public/images/ama-banner.jpg'

export default function Home() {
    return (
        <div>
            <Head>
                <title>zkAsk - Be Heard. Be Anonymous.</title>
                <meta name="description" content="Participate in AMA sessions anonymously" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navbar />
            <Image
                alt="Now on Air image"
                key={Date.now()}
                src={microphoneImage} 
                layout="responsive"
                priority
            />
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <ListActiveAma/>
                    </div>
                </div>
            </div>
        </div>
    )
}
