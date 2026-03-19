import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaTimes,
  FaSearch,
  FaMapMarkerAlt,
  FaCheck,
  FaTrash,
  FaChevronLeft,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const CATEGORIES = [
  "All",
  "Electronics",
  "Vehicles",
  "Furniture",
  "Clothing",
  "Home",
  "Sports",
  "Toys",
  "Other",
];

const CONDITIONS = ["New", "Like New", "Good", "Used"];

const IMG_MAX_DIM = 1600;
const IMG_QUALITY = 0.8;

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > IMG_MAX_DIM || height > IMG_MAX_DIM) {
        const ratio = Math.min(IMG_MAX_DIM / width, IMG_MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) =>
          resolve(
            new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() })
          ),
        "image/jpeg",
        IMG_QUALITY
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    loadItems();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadItems();
  }, [category]);

  const loadItems = async () => {
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      params.set("sold", "false");
      const res = await api.get(`/marketplace?${params}`);
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!search.trim()) return loadItems();
    try {
      const params = new URLSearchParams({ q: search });
      if (category !== "All") params.set("category", category);
      const res = await api.get(`/marketplace/search?${params}`);
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreated = (item) => {
    setItems([item, ...items]);
    setShowCreate(false);
  };

  const handleSold = async (id) => {
    try {
      const res = await api.put(`/marketplace/${id}/sold`);
      setItems(items.map((i) => (i._id === id ? res.data : i)));
      if (selectedItem?._id === id) setSelectedItem(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await api.delete(`/marketplace/${id}`);
      setItems(items.filter((i) => i._id !== id));
      if (selectedItem?._id === id) setSelectedItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Detail view
  if (selectedItem) {
    return (
      <div className="marketplace-page">
        <div className="marketplace-detail">
          <button className="mp-back-btn" onClick={() => setSelectedItem(null)}>
            <FaChevronLeft /> Back
          </button>
          <div className="mp-detail-content">
            <div className="mp-detail-images">
              {selectedItem.images?.length > 0 ? (
                selectedItem.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="mp-detail-img" />
                ))
              ) : (
                <div className="mp-no-image-large">No Image</div>
              )}
            </div>
            <div className="mp-detail-info">
              <h2>${selectedItem.price.toLocaleString()} {selectedItem.currency}</h2>
              <h3>{selectedItem.title}</h3>
              {selectedItem.sold && <span className="mp-sold-badge-large">SOLD</span>}
              <div className="mp-detail-meta">
                <span className="mp-detail-condition">{selectedItem.condition}</span>
                <span className="mp-detail-category">{selectedItem.category}</span>
              </div>
              {selectedItem.location && (
                <p className="mp-detail-location">
                  <FaMapMarkerAlt /> {selectedItem.location}
                </p>
              )}
              {selectedItem.description && (
                <div className="mp-detail-desc">
                  <h4>Description</h4>
                  <p>{selectedItem.description}</p>
                </div>
              )}
              <Link to={`/profile/${selectedItem.seller._id}`} className="mp-seller-info">
                <img
                  src={selectedItem.seller.profilePicture || "/default-avatar.svg"}
                  alt=""
                  className="avatar-small"
                />
                <span>{selectedItem.seller.firstName} {selectedItem.seller.lastName}</span>
              </Link>
              {selectedItem.seller._id === user?._id && (
                <div className="mp-detail-actions">
                  <button
                    className={`btn-primary ${selectedItem.sold ? "btn-success" : ""}`}
                    onClick={() => handleSold(selectedItem._id)}
                  >
                    <FaCheck /> {selectedItem.sold ? "Mark Available" : "Mark as Sold"}
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(selectedItem._id)}>
                    <FaTrash /> Delete
                  </button>
                </div>
              )}
              {selectedItem.seller._id !== user?._id && (
                <button
                  className="btn-primary mp-message-btn"
                  onClick={async () => {
                    try {
                      const res = await api.post("/messages/conversations", { receiverId: selectedItem.seller._id });
                      navigate("/messenger", { state: { openConversation: res.data } });
                    } catch (err) {
                      console.error(err);
                      navigate("/messenger");
                    }
                  }}
                >
                  Message Seller
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-page">
      {/* Sidebar — desktop only */}
      {!isMobile && (
        <div className="marketplace-sidebar">
          <h2>Marketplace</h2>
          <div className="mp-search-bar">
            <FaSearch className="mp-search-icon" />
            <input
              placeholder="Search Marketplace"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button className="mp-sell-btn" onClick={() => setShowCreate(true)}>
            <FaPlus /> Sell Something
          </button>
          <div className="mp-categories">
            <h4>Categories</h4>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`mp-cat-btn ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="marketplace-main">
        {/* Mobile header */}
        {isMobile && (
          <div className="mp-mobile-header">
            <h2>Marketplace</h2>
            <div className="mp-mobile-controls">
              <div className="mp-search-bar">
                <FaSearch className="mp-search-icon" />
                <input
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button className="mp-sell-btn-sm" onClick={() => setShowCreate(true)}>
                <FaPlus />
              </button>
            </div>
            <div className="mp-cat-scroll">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`mp-cat-chip ${category === c ? "active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="empty-text">Loading...</p>
        ) : items.length === 0 ? (
          <p className="empty-text">No listings found. Be the first to sell something!</p>
        ) : (
          <div className="marketplace-grid">
            {items.map((item) => (
              <div
                key={item._id}
                className={`product-card ${item.sold ? "sold" : ""}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="product-card-img">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.title} />
                  ) : (
                    <div className="mp-no-image">No Image</div>
                  )}
                  {item.sold && <div className="mp-sold-overlay">SOLD</div>}
                </div>
                <div className="product-card-info">
                  <span className="product-price">
                    ${item.price.toLocaleString()} {item.currency}
                  </span>
                  <span className="product-title">{item.title}</span>
                  {item.location && (
                    <span className="product-location">
                      <FaMapMarkerAlt /> {item.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create listing modal */}
      {showCreate && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

/* ---- Create Listing Modal ---- */
function CreateListingModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [condition, setCondition] = useState("Used");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState([]); // [{ file, preview }]
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    const compressed = [];
    for (const f of files) {
      const c = await compressImage(f);
      compressed.push({ file: c, preview: URL.createObjectURL(c) });
    }
    setImages((prev) => [...prev, ...compressed].slice(0, 5));
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("price", price);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("location", location);
      images.forEach((img) => formData.append("images", img.file));
      const res = await api.post("/marketplace", formData);
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      onCreated(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to create listing");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-listing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Listing</h3>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Image upload */}
          <div className="listing-images-row">
            {images.map((img, i) => (
              <div key={i} className="listing-img-preview">
                <img src={img.preview} alt="" />
                <button onClick={() => removeImage(i)}>
                  <FaTimes />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button className="listing-add-img" onClick={() => fileRef.current.click()}>
                <FaPlus />
                <span>Add Photos</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFiles}
            />
          </div>

          <input
            className="listing-input"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="listing-input"
            placeholder="Price *"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <div className="listing-row">
            <select
              className="listing-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="listing-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <input
            className="listing-input"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <textarea
            className="listing-textarea"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="modal-footer">
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !price}
            style={{ width: "100%" }}
          >
            {loading ? "Publishing..." : "Publish Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
