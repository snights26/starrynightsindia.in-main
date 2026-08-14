import { useCallback, useEffect, useRef, useState } from "react";
import api, { resolveAssetUrl } from "../../utils/api";
import "./OccasionPopup.css";

const DISMISSAL_KEY = "starry-dismissed-occasion-popup";

function campaignIdentity(campaign) {
  return campaign?.id && campaign?.version ? `${campaign.id}:${campaign.version}` : "";
}

function dismissedIdentity() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DISMISSAL_KEY) || "null");
    return typeof parsed?.identity === "string" ? parsed.identity : "";
  } catch {
    return "";
  }
}

/**
 * An optional global public campaign. It has no dependency on IndexedDB: a changed campaign is
 * always checked through its lightweight endpoint and any unavailable API simply leaves the site usable.
 */
export default function OccasionPopup() {
  const [campaign, setCampaign] = useState(null);
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const closeButton = useRef(null);
  const lastFocused = useRef(null);

  const close = useCallback(() => {
    const identity = campaignIdentity(campaign);
    if (identity) {
      try {
        window.localStorage.setItem(DISMISSAL_KEY, JSON.stringify({ identity, dismissedAt: new Date().toISOString() }));
      } catch {
        // Storage privacy/quota restrictions may make dismissal session-only, never a site failure.
      }
    }
    setOpen(false);
  }, [campaign]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const result = await api.get("/occasion-popups/current");
        const identity = campaignIdentity(result);
        if (!mounted || !identity || dismissedIdentity() === identity) return;
        setCampaign(result);
        setImageFailed(false);
        lastFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpen(true);
      } catch {
        // A campaign is optional; normal website navigation must never wait for or fail with it.
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    window.setTimeout(() => closeButton.current?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        // The dialog has one interactive element, so retain keyboard focus there.
        event.preventDefault();
        closeButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      lastFocused.current?.focus?.();
    };
  }, [close, open]);

  if (!open || !campaign) return null;
  const imageUrl = resolveAssetUrl(campaign.imageUrl);
  const imageStyle = imageUrl ? { "--occasion-popup-image": `url("${imageUrl}")` } : undefined;
  return <div className="occasion-popup-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="occasion-popup-dialog" style={imageStyle} role="dialog" aria-modal="true" aria-labelledby="occasion-popup-title" aria-describedby={campaign.message ? "occasion-popup-message" : undefined}>
      <div className="occasion-popup-dialog__blur" aria-hidden="true" />
      <div className="occasion-popup-dialog__shade" aria-hidden="true" />
      <button
        ref={closeButton}
        type="button"
        className="occasion-popup-dialog__close"
        onClick={(event) => {
          event.stopPropagation();
          close();
        }}
        aria-label="Close occasion popup"
      >
        {"\u00D7"}
      </button>
      <div className="occasion-popup-dialog__content">
        {!imageFailed && imageUrl && <img src={imageUrl} alt={campaign.title} onError={() => setImageFailed(true)} />}
        <div className={`occasion-popup-dialog__copy ${imageFailed || !imageUrl ? "occasion-popup-dialog__copy--fallback" : ""}`}>
          <h2 id="occasion-popup-title">{campaign.title}</h2>
          {campaign.message && <p id="occasion-popup-message">{campaign.message}</p>}
        </div>
      </div>
    </section>
  </div>;
}
