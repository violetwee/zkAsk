import React from "react"
import ListActiveAma from "../components/ListActiveAma"
import Header from "../components/Header"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Image from 'next/image'
import microphoneImage from '../public/images/ama-banner.jpg'

export default function Home() {
    return (
        <div>
            <Header />
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
            <Footer />
        </div>
    )
}
