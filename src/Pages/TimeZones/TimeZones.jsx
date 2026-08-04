import { useEffect, useMemo, useState } from "react";
import { MdArrowBack, MdLocationOn } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./TimeZones.css";

const TIME_ZONE_REGIONS = [
  {
    timeZone: "Asia/Kolkata",
    zoneLabel: "India Standard Time",
    regionName: "India",
    categoryCodes: ["REGION-CENTRAL", "REGION-SOUTH", "REGION-NORTHEAST", "REGION-WEST", "REGION-EAST", "REGION-NORTH"],
  },
  {
    timeZone: "Europe/London",
    zoneLabel: "Greenwich Mean Time",
    regionName: "Europe & Africa",
    categoryCodes: ["REGION-EUROPE", "REGION-AFRICA"],
  },
  {
    timeZone: "America/New_York",
    zoneLabel: "Eastern Time",
    regionName: "The Americas",
    categoryCodes: ["REGION-NORTH-AMERICA", "REGION-SOUTH-AMERICA"],
  },
  {
    timeZone: "Asia/Singapore",
    zoneLabel: "Singapore Standard Time",
    regionName: "Asia & Islands",
    categoryCodes: ["REGION-ASIA", "REGION-ISLANDS"],
  },
  {
    timeZone: "Australia/Sydney",
    zoneLabel: "Australian Eastern Time",
    regionName: "Oceania & Antarctica",
    categoryCodes: ["REGION-OCEANIA", "REGION-ANTARCTICA"],
  },
];

function clockParts(timeZone, date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type) => Number(parts.find((item) => item.type === type)?.value || 0);
  return { hour: part("hour"), minute: part("minute"), second: part("second") };
}

function formattedTime(timeZone, date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function AnalogClock({ timeZone, now }) {
  const { hour, minute, second } = clockParts(timeZone, now);
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = (minute + second / 60) * 6;
  const secondAngle = second * 6;

  return (
    <div className="timezone-clock" aria-hidden="true">
      <span className="timezone-clock__marker timezone-clock__marker--twelve">12</span>
      <span className="timezone-clock__marker timezone-clock__marker--three">3</span>
      <span className="timezone-clock__marker timezone-clock__marker--six">6</span>
      <span className="timezone-clock__marker timezone-clock__marker--nine">9</span>
      <span className="timezone-clock__hand timezone-clock__hand--hour" style={{ transform: `rotate(${hourAngle}deg)` }} />
      <span className="timezone-clock__hand timezone-clock__hand--minute" style={{ transform: `rotate(${minuteAngle}deg)` }} />
      <span className="timezone-clock__hand timezone-clock__hand--second" style={{ transform: `rotate(${secondAngle}deg)` }} />
      <span className="timezone-clock__pin" />
    </div>
  );
}

export default function TimeZones() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/categories/tree")
      .then((tree) => {
        if (!active) return;
        setCategoryTree(Array.isArray(tree) ? tree : []);
      })
      .catch(() => active && setCategoryTree([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const timeZones = useMemo(() => {
    const usedCodes = new Set();

    return TIME_ZONE_REGIONS.reduce((resolved, definition) => {
      const availableCategories = categoryTree.flatMap((parent) => [parent, ...(parent.children || [])]);
      const categories = definition.categoryCodes
        .map((code) => availableCategories.find((item) => (item.code || item.categoryCode) === code))
        .filter((category) => category && !usedCodes.has(category.code || category.categoryCode));
      if (!categories.length) return resolved;

      categories.forEach((category) => usedCodes.add(category.code || category.categoryCode));
      resolved.push({
        ...definition,
        categories,
      });
      return resolved;
    }, []);
  }, [categoryTree]);

  return (
    <main className="timezones-page">
      <div className="timezones-page__header">
        <button className="timezones-back" type="button" onClick={() => navigate(-1)}><MdArrowBack /> Back</button>
        <div>
          <p className="timezones-page__eyebrow">Live travel time</p>
          <h1>Explore packages by time zone</h1>
          <p>Choose a regional clock, then select a region to view its package collection.</p>
        </div>
      </div>

      {loading ? (
        <p className="timezones-state">Loading regional time zones…</p>
      ) : timeZones.length ? (
        <section className="timezones-grid" aria-label="Regional time zones">
          {timeZones.map((zone) => (
            <button
              className="timezone-card"
              key={zone.timeZone}
              type="button"
              onClick={() => navigate("/all-categories", {
                state: {
                  title: `${zone.regionName} regions`,
                  items: zone.categories,
                },
              })}
              aria-label={`View ${zone.regionName} regions for ${zone.zoneLabel}`}
            >
              <AnalogClock timeZone={zone.timeZone} now={now} />
              <span className="timezone-card__time">{formattedTime(zone.timeZone, now)}</span>
              <strong>{zone.regionName}</strong>
              <span>{zone.zoneLabel}</span>
              <small><MdLocationOn /> {zone.timeZone}</small>
            </button>
          ))}
        </section>
      ) : (
        <p className="timezones-state">No region categories are available for time-zone browsing yet.</p>
      )}
    </main>
  );
}
