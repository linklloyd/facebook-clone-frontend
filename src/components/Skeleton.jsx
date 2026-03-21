/**
 * Reusable skeleton loading components for all pages.
 */

export function PostSkeleton({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-post">
      <div className="skeleton-post-header">
        <div className="skeleton-circle skeleton-avatar" />
        <div className="skeleton-post-meta">
          <div className="skeleton-line" style={{ width: "40%" }} />
          <div className="skeleton-line short" style={{ width: "25%" }} />
        </div>
      </div>
      <div className="skeleton-post-body">
        <div className="skeleton-line" style={{ width: "90%" }} />
        <div className="skeleton-line" style={{ width: "70%" }} />
        <div className="skeleton-line" style={{ width: "50%" }} />
      </div>
      {i % 2 === 0 && <div className="skeleton-image" />}
      <div className="skeleton-post-actions">
        <div className="skeleton-line" style={{ width: "20%" }} />
        <div className="skeleton-line" style={{ width: "20%" }} />
        <div className="skeleton-line" style={{ width: "20%" }} />
      </div>
    </div>
  ));
}

export function ProfileSkeleton() {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-cover" />
      <div className="skeleton-profile-info">
        <div className="skeleton-circle skeleton-profile-pic" />
        <div className="skeleton-profile-text">
          <div className="skeleton-line" style={{ width: "200px", height: "24px" }} />
          <div className="skeleton-line" style={{ width: "140px" }} />
        </div>
      </div>
      <div className="skeleton-profile-body">
        <div className="skeleton-line" style={{ width: "60%" }} />
        <div className="skeleton-line" style={{ width: "45%" }} />
        <div className="skeleton-line" style={{ width: "35%" }} />
      </div>
    </div>
  );
}

export function MarketplaceSkeleton({ count = 6 }) {
  return (
    <div className="marketplace-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-product">
          <div className="skeleton-image" />
          <div className="skeleton-product-info">
            <div className="skeleton-line" style={{ width: "50%" }} />
            <div className="skeleton-line" style={{ width: "70%" }} />
            <div className="skeleton-line short" style={{ width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivitySkeleton({ count = 5 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-activity">
      <div className="skeleton-circle skeleton-avatar" />
      <div className="skeleton-activity-text">
        <div className="skeleton-line" style={{ width: "75%" }} />
        <div className="skeleton-line short" style={{ width: "30%" }} />
      </div>
    </div>
  ));
}

export function FriendsSkeleton({ count = 6 }) {
  return (
    <div className="friends-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-friend">
          <div className="skeleton-circle" style={{ width: 72, height: 72 }} />
          <div className="skeleton-line" style={{ width: "60%", margin: "8px auto 0" }} />
        </div>
      ))}
    </div>
  );
}

export function ConversationSkeleton({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-conversation">
      <div className="skeleton-circle skeleton-avatar" />
      <div className="skeleton-conv-text">
        <div className="skeleton-line" style={{ width: "60%" }} />
        <div className="skeleton-line short" style={{ width: "40%" }} />
      </div>
    </div>
  ));
}

export function StorySkeleton({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-story" />
  ));
}
