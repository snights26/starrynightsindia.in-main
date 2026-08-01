import DynamicRowsContainer from "./DynamicRowsContainer";

import "./Trending.css";

export default function Trending() {
  return (
    <div className="trending-page">
      
      {/* Hero */}
      <div className="trending-hero">
        <h1>
          <span className="brand-red">Trending</span> Experiences
        </h1>
        <p>Discover what travelers are loving right now</p>
      </div>

      <DynamicRowsContainer page="trending" />

    </div>
  );
}
