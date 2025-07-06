// For reusable components
import { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Modal} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import LogOut from '../features/auth/pages/logout';
import { axiosInstance } from './axios';

function NavigationBar() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() =>{
    const fetchAuth= async()=>{
      try{
        const response=await axiosInstance.get('/auth/status');
        setAuthenticated(response.data.authenticated);
      }catch(err){
        console.error('Failed to get Authentication', err);
      }
    };
    fetchAuth();
  },[]);

  if(authenticated){
    return (
      <> 
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">NTU Stars Swapper</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                <Nav.Link as={Link} to="/post/filter">Search</Nav.Link>
                <Nav.Link as={Link} to="/post/self">Own Posts</Nav.Link>
                <Nav.Link as={Link} to="/create">Create Post</Nav.Link>
                <Nav.Link as={Link} to="/chats">Chats</Nav.Link>
                <Button 
                    variant="outline-light" 
                    className="ms-2"
                    onClick={() => setShowLogoutModal(true)}
                  >
                    Logout
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <LogOut 
            show={showLogoutModal} 
            onHide={() => setShowLogoutModal(false)} 
          />
      </>
    );
  }
  else{
    return(
      <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">NTU Stars Swapper</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                <Nav.Link as={Link} to="/">Login</Nav.Link>
                <Nav.Link as={Link} to="/post/filter">Sign Up</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
      </Navbar>

    )
  }
}

export default NavigationBar; 