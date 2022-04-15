// reactstrap components
import {
  Navbar,
  NavbarBrand,
  NavLink,
  NavbarToggler,
  NavItem,
  Collapse,
  Nav
} from "reactstrap";

export default function NavBar() {

  return (
    <div>
      <Navbar
        color="light"
        expand="md"
        light
      >
        <NavbarBrand href="/">
          zkAsk - Be Heard. Be Anonymous.
        </NavbarBrand>
        <NavbarToggler onClick={function noRefCheck(){}} />
        <Collapse navbar>
          <Nav
            className="me-auto"
            navbar
          >
            <NavItem>
              <NavLink href="/session/host">
                I&apos;m a Host
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="/">
                I&apos;m a Participant
              </NavLink>
            </NavItem>
          </Nav>
          
        </Collapse>
      </Navbar>
    </div>
  );
}