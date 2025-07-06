import { useState, useEffect,useRef  } from "react";
import { Card, Button, Form, Spinner, Container, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../../components/axios";

function UpdateProfile() {
    const [profile, setProfile] = useState(null);
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const effectRan = useRef(false);

    // Fetch existing profile or create a new one
    useEffect(() => {
        // This prevents the effect from running twice in development
        if (effectRan.current === true) return;
        effectRan.current = true;

        const fetchOrCreateProfile = async () => {
            try {
                setIsLoading(true);
                // First try to get existing profile
                const getResponse = await axiosInstance.get('/profile/getId', {
                    withCredentials: true
                });
                
                if (getResponse.data.success && getResponse.data.profile !== null) {
                    setProfile(getResponse.data.profile);
                    setUsername(getResponse.data.profile.username || "");
                    setAvatarUrl(getResponse.data.profile.avatar_url || "");
                    return;
                } else {
                    // If no profile exists, create a new one
                    try {
                        const createResponse = await axiosInstance.post('/profile/create', {
                            username: "",
                            avatar_url: ""
                        }, {
                            withCredentials: true
                        });
                        setProfile(createResponse.data.profile);
                    } catch (createErr) {
                        // If create fails with unique constraint error, try fetching again
                        if (createErr.response?.data?.error?.includes('duplicate key')) {
                            const retryResponse = await axiosInstance.get('/profile/', {
                                withCredentials: true
                            });
                            if (retryResponse.data.profile) {
                                setProfile(retryResponse.data.profile);
                                setUsername(retryResponse.data.profile.username || "");
                                setAvatarUrl(retryResponse.data.profile.avatar_url || "");
                            }
                        } else {
                            throw createErr;
                        }
                    }
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrCreateProfile();
        // Cleanup function
        return () => {
            effectRan.current = true;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        if (!username.trim()) {
            setError("Username cannot be empty");
            return;
        }

        try {
            setIsLoading(true);
            const response = await axiosInstance.put('/profile/update', {
                username,
                avatar_url: avatarUrl
            }, {
                withCredentials: true
            });
            
            setProfile(response.data.profile);
            setSuccess("Profile updated successfully!");
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !profile) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Card className="mx-auto" style={{ maxWidth: "600px" }}>
                <Card.Header as="h5">Your Profile</Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formUsername">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formAvatarUrl">
                            <Form.Label>Avatar URL</Form.Label>
                            <Form.Control
                                type="url"
                                placeholder="Enter URL for your avatar image"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                            />
                            {avatarUrl && (
                                <div className="mt-2">
                                    <p>Avatar Preview:</p>
                                    <img 
                                        src={avatarUrl} 
                                        alt="Avatar preview" 
                                        style={{ maxWidth: "100px", maxHeight: "100px" }}
                                        onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = "https://via.placeholder.com/100";
                                        }}
                                    />
                                </div>
                            )}
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                    <span className="ms-2">Saving...</span>
                                </>
                            ) : (
                                "Save Profile"
                            )}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default UpdateProfile;