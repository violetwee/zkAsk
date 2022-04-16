import Head from "next/head"
import React from "react"
import styles from "../styles/Home.module.css"
import ListActiveAma from "../components/ListActiveAma"
import Navbar from "../components/Navbar"

export default function Home() {
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
                <ListActiveAma/>
            </main>
            </div>
        </div>
    )
}
