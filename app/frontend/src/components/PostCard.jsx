import { Card, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const PostCard = ({ post }) => {

  const truncateText =(text, maxLength=50) =>{
    if(text.length <= maxLength) return text;
    return text.substring(0,30).trim() + "...";
  }

  return (
    <Card className="h-100 d-flex flex-column">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <Card.Title>{post.course_id}</Card.Title>
          <small className="text-muted">User: {post.username}</small>
        </div>
      </Card.Header>
      <Card.Body className="d-flex flex-column">
        <Card.Text className="mb-3">{truncateText(post.context)}</Card.Text>

        <div className="d-flex justify-content-between text-muted small mb-3">
          <span>Index: {post.index_id}</span>
          <div>
            {post.index_exchange_id && Array.isArray(post.index_exchange_id) && post.index_exchange_id.length > 0 ? (
              <div>
                <span className="me-2">Exchange:</span>
                {post.index_exchange_id.map((id, index) => (
                  <Badge key={index} bg="info" className="me-1" style={{ fontSize: '0.7em' }}>
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
  );
};

export default PostCard;
