import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const IST_TIME_ZONE = "Asia/Kolkata";

function getIstTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export default function LiveIstClock() {
  const [now, setNow] = useState(() => new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <button
      type="button"
      className="ist-live-clock"
      onClick={() => navigate("/time-zones")}
      aria-label="Open world time zones and region packages"
    >
      <span className="ist-live-clock__label">IST</span>
      <time dateTime={now.toISOString()}>{getIstTime(now)}</time>
    </button>
  );
}
