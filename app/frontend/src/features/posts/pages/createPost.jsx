import { useState } from 'react';
import { Form, Button, Alert, Container, Card, Row, Col, Badge} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../../components/axios';

function CreatePost() {
    const [course_id, setCourse_id] = useState('');
    const [context, setContext] =useState('');
    const [tag, setTag] =useState('');
    const [index_id, setIndex_id] =useState('');
    const [index_exchange_id, setIndex_exchange_id] =useState([]);
    const [currentExchangeId, setCurrentExchangeId] = useState('');
    const [error,setError] = useState(null);
    const navigate = useNavigate();

    const handleAddExchangeId = () => {
        if (currentExchangeId.trim() && !index_exchange_id.includes(currentExchangeId.trim())) {
            setIndex_exchange_id([...index_exchange_id, currentExchangeId.trim()]);
            setCurrentExchangeId('');
        }
    };

    const handleRemoveExchangeId = (idToRemove) => {
        setIndex_exchange_id(index_exchange_id.filter(id => id !== idToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddExchangeId();
        }
    };

    const handleSubmit = async(e) =>{
        e.preventDefault();

        if (index_exchange_id.length === 0) {
            setError('Please add at least one Index Exchange ID');
            return;
        }

        try{
            await axiosInstance.post('/posts',{
                course_id,
                context,
                tag,
                index_id,
                index_exchange_id
            },
            {
                withCredentials:true,
            }
        );
            navigate('/home');
        } catch(err){
            setError(err.response?.data?.message || 'Failed to create post');
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow">
                        <Card.Body>
                            <Card.Title className="text-center mb-4">Create New Post</Card.Title>
                            
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="courseId">
                                    <Form.Label>Course ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter course ID"
                                        value={course_id}
                                        onChange={(e) => setCourse_id(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="context">
                                    <Form.Label>Post Content</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        placeholder="Write your post here..."
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="tag">
                                    <Form.Label>Tag</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter tag (e.g., question, discussion)"
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="indexId">
                                            <Form.Label>Index ID</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter index ID"
                                                value={index_id}
                                                onChange={(e) => setIndex_id(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="indexExchangeId">
                                            <Form.Label>Index Exchange IDs</Form.Label>
                                            <div className="d-flex">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter exchange ID and press Enter"
                                                    value={currentExchangeId}
                                                    onChange={(e) => setCurrentExchangeId(e.target.value)}
                                                    onKeyUp={handleKeyPress}
                                                />
                                                <Button 
                                                    variant="outline-primary" 
                                                    className="ms-2"
                                                    onClick={handleAddExchangeId}
                                                    type="button"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                            
                                            {/* Display added exchange IDs */}
                                            <div className="mt-2">
                                                {index_exchange_id.map((id, index) => (
                                                    <Badge 
                                                        key={index} 
                                                        bg="secondary" 
                                                        className="me-2 mb-2"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {id}
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="text-white p-0 ms-1"
                                                            onClick={() => handleRemoveExchangeId(id)}
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </Badge>
                                                ))}
                                            </div>
                                            
                                            {index_exchange_id.length === 0 && (
                                                <Form.Text className="text-muted">
                                                    Add at least one Index Exchange ID
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-grid gap-2 mt-4">
                                    <Button variant="primary" type="submit" size="lg">
                                        Create Post
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        size="lg"
                                        onClick={() => navigate('/home')}
                                        type="button"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default CreatePost;