// Not needed anymore

import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../../../components/axios';

function PostDetailSelf(){
    const {id} = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [course_id, setCourse_id] = useState('');
    const [context, setContext] =useState('');
    const [tag, setTag] =useState('');
    const [index_id, setIndex_id] =useState('');
    const [index_exchange_id, setIndex_exchange_id] =useState([]);
    const [currentExchangeId, setCurrentExchangeId] = useState('');

    useEffect(() =>{
        const fetchPost = async () =>{
            try{
                const response = await axiosInstance.get(`/posts/${id}`);
                const postData =response.data.id_post;

                setPost(postData);
                setCourse_id(postData.course_id);
                setContext(postData.context);
                setTag(postData.tag);
                setIndex_id(postData.index_id);
                // handle index_exchange_id as array
                const exchangeIds= postData.index_exchange_id;
                setIndex_exchange_id(Array.isArray(exchangeIds) ? exchangeIds : []);
                setLoading(false);
            } catch(err){
                setError(err.response?.data?.error || err.message || "An unexpected error occurred");
                console.error('Update error:', err);
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

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

    const handleUpdate = async(e) =>{
        e.preventDefault();

        if (index_exchange_id.length === 0) {
            setError('Please add at least one Index Exchange ID');
            return;
        }

        try{
            const response = await axiosInstance.put(`/posts/${id}`,{
                course_id,
                context,
                tag,
                index_id,
                index_exchange_id
            },
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation' 
                }
            });
            // Handle the response based on API's actual response structure
            const updatedPost = response.data.post || response.data; // try both formats

            setPost(updatedPost);
            setIsEditing(false);
            setError(null); // Clear any previous errors 
        } catch(err){
            setError(err.response?.data?.error || err.message || "An unexpected error occurred");
            console.error('Update error:', err);
        }
    };

    const handleDelete = async() =>{
        if (window.confirm('Are you sure you want to delete this post?')){
            try{
                await axiosInstance.delete(`/posts/${id}`,{
                    withCredentials: true
                });
                navigate('/home');
            } catch (err){
                setError(err.response?.data?.error || err.message || "An unexpected error occurred");
                console.error('Update error:', err);;
            }
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!post) return <div>Post not found</div>;

    return (
        <div className="container mt-4">
            <Card className="shadow">
                <Card.Body>
                    {isEditing ? (
                        <>
                            <Card.Title className="mb-4">Edit Post</Card.Title>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleUpdate}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Course ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={course_id}
                                        onChange={(e) => setCourse_id(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Content</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Tag</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Index ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={index_id}
                                        onChange={(e) => setIndex_id(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Index Exchange IDs</Form.Label>
                                    <div className="d-flex">
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter exchange ID and press Enter"
                                            value={currentExchangeId}
                                            onChange={(e) => setCurrentExchangeId(e.target.value)}
                                            onKeyPress={handleKeyPress}
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

                                <div className="d-flex justify-content-between">
                                    <Button variant="success" type="submit">
                                        Save Changes
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        onClick={() => setIsEditing(false)}
                                        type="button"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Form>
                        </>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Card.Title>{post.title || "Post Details"}</Card.Title>
                                <div>
                                    <Button 
                                        variant="outline-primary" 
                                        className="me-2"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit
                                    </Button>
                                    <Button 
                                        variant="outline-danger"
                                        onClick={handleDelete}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Card.Subtitle className="mb-2 text-muted">
                                Course ID: {post.course_id}
                            </Card.Subtitle>

                            <Card.Text className="mt-3 mb-3">
                                {post.context}
                            </Card.Text>

                            <div className="text-muted small">
                                {post.tag && <span className="me-3">Tag: {post.tag}</span>}
                                {post.index_id && <span className="me-3">Index ID: {post.index_id}</span>}
                                {post.index_exchange_id && Array.isArray(post.index_exchange_id) && post.index_exchange_id.length > 0 && (
                                    <div className="mt-2">
                                        <span>Exchange IDs: </span>
                                        {post.index_exchange_id.map((id, index) => (
                                            <Badge key={index} bg="info" className="me-1">
                                                {id}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </Card.Body>
                <Card.Footer>
                    <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </Card.Footer>
            </Card>
        </div>
    );
}
export default PostDetailSelf;