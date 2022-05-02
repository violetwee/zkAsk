import Link from 'next/link'

export default function Footer() {
  return (
    <div className="footer">
        <footer>
            <hr />
            <ul className="list-inline">
                <li className="list-inline-item">
                  <Link href="/about">
                    <a>What is zkAsk</a>
                  </Link>
                </li>
                <li className="list-inline-item">
                  <Link href="/how-it-works">
                    <a>How it Works</a>
                  </Link>
                </li>
                <li className="list-inline-item">
                <Link href="/faq">
                    <a>FAQ</a>
                  </Link>
                </li>
            </ul>
            <p className="copyright">zkAsk © 2022</p>
        </footer>
    </div>
  );
}