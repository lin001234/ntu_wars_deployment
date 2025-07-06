import { useState, useEffect,useCallback, useRef } from "react";
import { Row, Col, Card, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { axiosInstance } from '../../../components/axios';

const LIMIT=15;

function Self_page() {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset,setOffset] = useState(0);
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

  const observer=useRef();
  
  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setOffset((prevOffset) => prevOffset + LIMIT);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchedOffsets = useRef(new Set());

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, 30).trim() + "...";
  };


  useEffect(() => {
    if (fetchedOffsets.current.has(offset)) return;
    fetchedOffsets.current.add(offset);

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
          "/posts/self",
          {
            withCredentials: true,
            params:{limit:LIMIT,offset},
          },
        );
        const newPosts= response.data.self_posts || [];
        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((p) => p.id));
          const filteredNew = newPosts.filter((p) => !existingIds.has(p.id));
          return [...prevPosts, ...filteredNew];
        });

        setHasMore(newPosts.length === LIMIT);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch post");   
      }
      setLoading(false);
    };
    fetchPosts();
  }, [offset]);

  return (
    <>
      {error && <div>{error}</div>}
      <Row xs={1} md={2} lg={3} className="g-4">
        {posts.map((post,index) => {
          const isLastPost=index===posts.length-1;
          return(
            <Col key={post.id} ref={isLastPost ? lastPostElementRef : null}>
              <Card className="h-100 d-flex flex-column">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <Card.Title>{post.course_id}</Card.Title>
                    <small className="text-muted">User: {post.username}</small>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <Card.Text className="mb-3">
                    {truncateText(post.context)}
                  </Card.Text>

                  <div className="d-flex justify-content-between text-muted small mb-3">
                    <span>Index: {post.index_id}</span>
                    <div>
                      {post.index_exchange_id &&
                      Array.isArray(post.index_exchange_id) &&
                      post.index_exchange_id.length > 0 ? (
                        <div>
                          <span className="me-2">Exchange:</span>
                          {post.index_exchange_id.map((id, index) => (
                            <Badge
                              key={index}
                              bg="info"
                              className="me-1"
                              style={{ fontSize: "0.7em" }}
                            >
                              {id}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span>Exchange: None</span>
                      )}
                    </div>
                  </div>

                  {post.tag && (
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <Badge bg="secondary">{post.tag}</Badge>
                      <Link to={`/post/${post.id}`}>
                        <Button variant="primary" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="text-muted small">
                  <div>Posted: {new Date(post.created_at).toLocaleString()}</div>
                  {post.updated_at && (
                    <div>Updated: {new Date(post.updated_at).toLocaleString()}</div>
                  )}
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>
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
      {loading && <div>Loading more posts...</div>}
      {!hasMore && <div>No more posts</div>}
    </>
  );
}

export default Self_page;
