import { useState, useEffect,useCallback, useRef } from "react";
import { Row, Col,Button } from "react-bootstrap";
import PostCard from "../../../components/PostCard";
import { axiosInstance } from '../../../components/axios';

const LIMIT=15;

function Home() {
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
        if (entries[0].isIntersecting && hasMore && ~loading) {
          setOffset((prevOffset) => prevOffset + LIMIT);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchedOffsets = useRef(new Set());

  useEffect(() => {
    if (fetchedOffsets.current.has(offset)) return;
    fetchedOffsets.current.add(offset);

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/posts/",{
          params:{limit:LIMIT,offset},
        });
        // update posts with feteched data
        console.log('Fetching posts with offset:', offset);
        const newPosts= response.data.allposts || [];
        console.log('New posts:', newPosts.map(p => p.id));

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
        {posts.map((post, index) => {
          const isLastPost = index === posts.length - 1;

          return (
            <Col key={post.id} ref={isLastPost ? lastPostElementRef : null}>
              <PostCard post={post} />
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

export default Home;
