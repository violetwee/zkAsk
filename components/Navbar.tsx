// reactstrap components
import {
  Navbar,
  NavbarBrand,
  NavbarToggler,
  NavItem,
  Nav,
  NavLink,
  Button
} from "reactstrap";
import Image from 'next/image'
import logo from '../public/images/zkask.png'

export default function NavBar() {
  return (
    <div>
      <Navbar
        expand="md"
        style={{backgroundColor:"#2A153A"}}
      >
        <NavbarBrand href="/" className="pl-3">
          <Image 
            alt="zkAsk logo"
            key={Date.now()}
            src={logo} 
          />
        </NavbarBrand>
        <NavbarToggler onClick={function noRefCheck(){}} />
          <Nav
            className="me-auto"
            navbar
          >
            <NavItem className="float-right">
              <NavLink href="/host">
                <Button color="primary">I&apos;m a host</Button>
              </NavLink>
            </NavItem>
          </Nav>
      </Navbar>
    </div>
  );
}