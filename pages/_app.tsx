import '../styles/globals.css'
import '../styles/custom.css';
import type { AppProps } from 'next/app'
import { ReactSession } from 'react-client-session';

function MyApp({ Component, pageProps }: AppProps) {
  ReactSession.setStoreType("memory");

  return <Component {...pageProps} />
}

export default MyApp
