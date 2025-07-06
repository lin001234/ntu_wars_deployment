import { useState, useEffect, useCallback, useRef } from "react";
import {Row,Col,Button,Form,Spinner,Alert,Badge,InputGroup} from "react-bootstrap";
import { axiosInstance } from '../../../components/axios';
import PostCard from "../../../components/PostCard.jsx";

function Filtered_posts() {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset,setOffset] = useState(0);
  const [filters, setFilters] = useState({
    course_id: "",
    tag: "",
    index_id: "",
    index_exchange_id: [],
  });

  const [exchangeIdInput, setExchangeIdInput] = useState("");
  const [indexIdInput, setIndexIdInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTopButton,setShowTopButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowTopButton(true);
      } else {
        setShowTopButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  // Only when clicking filter for exact string search
  const searchPosts = async () =>{
    setLoading(true);
    setError(null);

    try{
      const params={};
      for (const key in filters){
        if (filters[key]) {
        // Handle arrays properly - send as actual arrays
          if (Array.isArray(filters[key]) && filters[key].length > 0) {
            params[key] = filters[key];
          } 
          else if (!Array.isArray(filters[key])) {
            params[key] = filters[key];
          }
        }
      }
      const response = await axiosInstance.get(
        "/posts/search",
        { params }
      );
      setPosts(response.data.posts || []);
    } catch(err){
      setError(
        err.response?.data?.error ||
          err.message ||
          "An unexpected error occurred"
      );
    } finally{
      setLoading(false);
    }
  }
  // Real time filtering for substrings
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      for (const key in filters) {
        if (filters[key]) {
        // Handle arrays properly - send as actual arrays
          if (Array.isArray(filters[key]) && filters[key].length > 0) {
            params[key] = filters[key];
          } 
          else if (!Array.isArray(filters[key])) {
            params[key] = filters[key];
          }
        }
      }

      const response = await axiosInstance.get(
        "/posts/filter",
        { params }
      );
      setPosts(response.data.posts || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleAddExchangeId = () => {
    if (exchangeIdInput.trim() && !filters.index_exchange_id.includes(exchangeIdInput.trim())) {
      setFilters({
        ...filters,
        index_exchange_id: [...filters.index_exchange_id, exchangeIdInput.trim()]
      });
      setExchangeIdInput("");
    }
  };

  const handleRemoveExchangeId = (idToRemove) => {
    setFilters({
      ...filters,
      index_exchange_id: filters.index_exchange_id.filter(id => id !== idToRemove)
    });
  };

  const handleAddIndexId = () => {
    if (indexIdInput.trim() && !filters.index_id.includes(indexIdInput.trim())) {
      setFilters({
        ...filters,
        index_id: [...filters.index_id, indexIdInput.trim()]
      });
      setIndexIdInput("");
    }
  };

  const handleRemoveIndexId = (idToRemove) => {
    setFilters({
      ...filters,
      index_id: filters.index_id.filter(id => id !== idToRemove)
    });
  };

  const handleExchangeIdKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddExchangeId();
    }
  };

  const handleIndexIdKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIndexId();
    }
  };

  //for filter button 
  const handleFilter = (e) => {
    e.preventDefault();
    searchPosts();
  };

  //Add a reset function to clear all filters
  const handleReset = () => {
    setFilters({
      course_id: "",
      tag: "",
      index_id: "",
      index_exchange_id: [],
    });
    setExchangeIdInput("");
    setIndexIdInput("");
  };
  return (
    <div className="container py-4">
      <h2 className="mb-4">Filter Posts</h2>
      <Form onSubmit={handleFilter} className="mb-4">
        <Row className="g-3">
          <Col md={3}>
          <Form.Label className="small text-muted">Course ID</Form.Label>
            <Form.Control
              type="text"
              name="course_id"
              placeholder="Add Course ID"
              value={filters.course_id}
              onChange={handleInputChange}
            />
          </Col>
          <Col md={3}>
            <Form.Label className="small text-muted">Tag</Form.Label>
            <Form.Control
              type="text"
              name="tag"
              placeholder="Add Tag"
              value={filters.tag}
              onChange={handleInputChange}
            />
          </Col>
          <Col md={3}>
            <Form.Label className="small text-muted">Index IDs</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Add Index ID"
                value={indexIdInput}
                onChange={(e) => setIndexIdInput(e.target.value)}
                onKeyUp={handleIndexIdKeyPress}
              />
              <Button 
                variant="outline-primary" 
                onClick={handleAddIndexId}
                disabled={!indexIdInput.trim()}
              >
                Add
              </Button>
            </InputGroup>
            {filters.index_id.length > 0 && (
              <div className="mt-2">
                {filters.index_id.map((id, index) => (
                  <Badge 
                    key={index} 
                    bg="primary" 
                    className="me-1 mb-1"
                    style={{ cursor: 'pointer' }}
                  >
                    {id} 
                    <span 
                      className="ms-1" 
                      onClick={() => handleRemoveIndexId(id)}
                      style={{ cursor: 'pointer' }}
                    >
                      ×
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </Col>
          <Col md={3}>
            <Form.Label className="small text-muted">Index Exchange IDs</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Add Exchange ID"
                value={exchangeIdInput}
                onChange={(e) => setExchangeIdInput(e.target.value)}
                onKeyUp={handleExchangeIdKeyPress}
              />
              <Button 
                variant="outline-primary" 
                onClick={handleAddExchangeId}
                disabled={!exchangeIdInput.trim()}
              >
                Add
              </Button>
            </InputGroup>
            {filters.index_exchange_id.length > 0 && (
              <div className="mt-2">
                {filters.index_exchange_id.map((id, index) => (
                  <Badge 
                    key={index} 
                    bg="secondary" 
                    className="me-1 mb-1"
                    style={{ cursor: 'pointer' }}
                  >
                    {id} 
                    <span 
                      className="ms-1" 
                      onClick={() => handleRemoveExchangeId(id)}
                      style={{ cursor: 'pointer' }}
                    >
                      ×
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </Col>
          <Col xs="auto">
            <Button type="submit" variant="primary">
              Search
            </Button>
          </Col>
          <Col xs="auto">
            <Button type="button" variant="outline-secondary" onClick={handleReset}>
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Form>
      
      {showTopButton && (
        <Button
          onClick={scrollToTop}
          variant="secondary"
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            zIndex: 1000,
            borderRadius: "50%",
            padding: "10px 14px",
            fontSize: "1.2rem"
          }}
        >
          ↑
        </Button>
      )}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : posts.length === 0 ? (
        <Alert variant="info">No posts found.</Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {posts.map((post) => (
            <Col key={post.id}>
              <PostCard post={post} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default Filtered_posts;