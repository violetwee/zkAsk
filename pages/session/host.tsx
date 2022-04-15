import Head from "next/head"
import React from "react"
import styles from "../../styles/Host.module.css"
import CreateAmaForm from "../../components/CreateAmaForm"
import ListOwnerAma from "../../components/ListOwnerAma"
import Navbar from "../../components/Navbar"

export default function Host() {
    return (
        <div>
            <Head>
                <title>zkAMA - Be Heard. Be Anonymous.</title>
                <meta name="description" content="Participate in AMA sessions anonymously" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navbar />
            <div className={styles.container}>
            <main className={styles.main}>
              
                <CreateAmaForm/>
                <ListOwnerAma/>
            </main>
            </div>
        </div>
    )
}
