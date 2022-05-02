import React from "react"
import CreateAmaForm from "../components/CreateAmaForm"
import ListOwnerAma from "../components/ListOwnerAma"
import Header from "../components/Header"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import {
    Container,
    Row,
    Col,
    Nav,
    NavItem,
    NavLink
} from "reactstrap";

export default function Host() {
    const [menuSelection, setMenuSelection] = React.useState(1)
    const showComponent = (menuId: number) => {
        setMenuSelection(menuId)
    }

    return (
        <div>
            <Header />
            <Navbar />

            {/* Secondary Menu */}
            <Container>
            <Row>
                <Col className="pt-5 pb-5">
                <Nav className="sub-menu bg-gradient-secondary">
                    <NavItem>
                        <NavLink 
                            active={(menuSelection == 1 ? true : false)}
                            href="#"
                            onClick={() => showComponent(1)}
                            >
                            Create
                        </NavLink>
                    </NavItem>
                    |
                    <NavItem>
                        <NavLink
                            active={(menuSelection == 2 ? true : false)}
                            href="#"
                            onClick={() => showComponent(2)}
                            >
                            My AMA Sessions
                        </NavLink>
                    </NavItem>
                </Nav>
                </Col>
            </Row>
            </Container>
            

            <div>
                <main>
                {menuSelection == 1 &&
                    <CreateAmaForm/>
                }
                {menuSelection == 2 &&
                    <ListOwnerAma/>
                } 
                </main>
            </div>
            <Footer />
        </div>
    )
}
