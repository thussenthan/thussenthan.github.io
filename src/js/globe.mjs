import createGlobe from "https://cdn.jsdelivr.net/npm/cobe@2/+esm";

const canvas = document.getElementById("cobe");
if (!canvas) {
  throw new Error("Globe canvas not found");
}

const aboutPage = document.querySelector('[data-page="about"]');
const CMB = [6.8521, 79.8612];
const SIN = [1.3644, 103.9915];
const SFO = [37.6213, -122.379];
const ICN = [37.4602, 126.4407];
const HKG = [22.308, 113.9185];
const LHR = [51.4775, -0.4614];
const MDT = [40.1935, -76.7634];
const JFK = [40.6413, -73.7781];
const IAD = [38.9531, -77.4565];
const IST = [41.2753, 28.7519];
const MLE = [4.1918, 73.529];
const EWR = [40.6895, -74.1745];
const MUC = [48.3538, 11.7861];
const DOH = [25.2608, 51.6138];
const BOS = [42.3656, -71.0096];
const BNA = [36.1245, -86.6782];
const PHL = [39.8721, -75.2411];
const ORD = [41.9742, -87.9073];
const DCA = [38.8512, -77.0402];
const DXB = [25.2532, 55.3657];
const YYZ = [43.6777, -79.6248];
const YYC = [51.1215, -114.0076];
const SEA = [47.4502, -122.3088];
const CITY_IDS = ["jaffna", "lemoyne", "fremont", "princeton", "boston"];

let phi = 0;
let theta = 0.3;
let isResetting = false;
let resetTimer;
let globe;
let rafId;
let isDragging = false;
let lastX;
let lastY;
let velocityPhi = 0;
let velocityTheta = 0;

const dpr = Math.min(window.devicePixelRatio || 2, 1.5);
const friction = 0.95;
const defaultTheta = 0.3;
const resetEase = 0.035;

function startGlobeAnimation() {
  if (rafId !== null && rafId !== undefined) return;
  rafId = requestAnimationFrame(tick);
}

function stopGlobeAnimation() {
  if (rafId === null || rafId === undefined) return;
  cancelAnimationFrame(rafId);
  rafId = null;
}

function tick() {
  if (
    document.visibilityState === "hidden" ||
    !aboutPage?.classList.contains("active") ||
    !globe
  ) {
    stopGlobeAnimation();
    return;
  }

  phi += velocityPhi;
  theta += velocityTheta;
  velocityPhi *= friction;
  velocityTheta *= friction;
  phi += 0.003;

  if (isResetting) {
    const diff = ((defaultTheta - theta + Math.PI) % (2 * Math.PI)) - Math.PI;
    theta += diff * resetEase;
    if (Math.abs(diff) < 0.001) {
      theta = defaultTheta;
      isResetting = false;
    }
  }

  globe.update({ phi, theta });
  rafId = requestAnimationFrame(tick);
}

function initGlobe() {
  stopGlobeAnimation();
  if (globe) globe.destroy();

  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.offsetWidth || 400;
  const height = rect.height || width;

  globe = createGlobe(canvas, {
    devicePixelRatio: dpr,
    width,
    height,
    phi,
    theta,
    dark: 1,
    diffuse: 1.6,
    scale: 1,
    mapSamples: 12000,
    mapBrightness: 6,
    baseColor: [0.8, 0.8, 0.8],
    markerColor: [1, 0.8588235294, 0.4392156863],
    glowColor: [0.5, 0.5, 0.5],
    offset: [0, 0],
    opacity: 0.9,
    markers: [
      { location: [9.6615, 80.0255], size: 0.03, id: "jaffna" },
      { location: [40.2454, -76.8961], size: 0.03, id: "lemoyne" },
      { location: [37.5485, -121.9886], size: 0.03, id: "fremont" },
      { location: [40.3573, -74.6672], size: 0.03, id: "princeton" },
      { location: [42.3601, -71.0589], size: 0.03, id: "boston" },
    ],
    arcs: [
      { from: CMB, to: SIN, color: [0.4, 0.34, 0.17] },
      { from: SIN, to: SFO, color: [0.4, 0.34, 0.17] },
      { from: SFO, to: ICN, color: [0.4, 0.34, 0.17] },
      { from: ICN, to: HKG, color: [0.4, 0.34, 0.17] },
      { from: HKG, to: CMB, color: [0.4, 0.34, 0.17] },
      { from: CMB, to: LHR, color: [1.2, 1.03, 0.52] },
      { from: LHR, to: MDT, color: [0.4, 0.34, 0.17] },
      { from: JFK, to: LHR, color: [0.8, 0.69, 0.35] },
      { from: LHR, to: CMB, color: [1.2, 1.03, 0.52] },
      { from: CMB, to: LHR, color: [1.2, 1.03, 0.52] },
      { from: LHR, to: JFK, color: [0.8, 0.69, 0.35] },
      { from: IAD, to: IST, color: [0.8, 0.69, 0.35] },
      { from: IST, to: MLE, color: [0.8, 0.69, 0.35] },
      { from: MLE, to: CMB, color: [0.8, 0.69, 0.35] },
      { from: CMB, to: MLE, color: [0.8, 0.69, 0.35] },
      { from: MLE, to: IST, color: [0.8, 0.69, 0.35] },
      { from: IST, to: IAD, color: [0.8, 0.69, 0.35] },
      { from: EWR, to: LHR, color: [0.4, 0.34, 0.17] },
      { from: LHR, to: MUC, color: [0.4, 0.34, 0.17] },
      { from: MUC, to: EWR, color: [0.4, 0.34, 0.17] },
      { from: IAD, to: DOH, color: [0.8, 0.69, 0.35] },
      { from: DOH, to: CMB, color: [0.8, 0.69, 0.35] },
      { from: CMB, to: DOH, color: [0.8, 0.69, 0.35] },
      { from: DOH, to: IAD, color: [0.8, 0.69, 0.35] },
      { from: BOS, to: BNA, color: [0.8, 0.69, 0.35] },
      { from: BNA, to: BOS, color: [0.8, 0.69, 0.35] },
      { from: BOS, to: PHL, color: [0.8, 0.69, 0.35] },
      { from: PHL, to: BOS, color: [0.8, 0.69, 0.35] },
      { from: MDT, to: ORD, color: [1.2, 1.03, 0.52] },
      { from: ORD, to: SEA, color: [0.8, 0.69, 0.35] },
      { from: SEA, to: ORD, color: [0.8, 0.69, 0.35] },
      { from: ORD, to: MDT, color: [1.2, 1.03, 0.52] },
      { from: DCA, to: EWR, color: [0.8, 0.69, 0.35] },
      { from: EWR, to: DXB, color: [0.8, 0.69, 0.35] },
      { from: DXB, to: CMB, color: [0.8, 0.69, 0.35] },
      { from: CMB, to: DXB, color: [0.8, 0.69, 0.35] },
      { from: DXB, to: EWR, color: [0.8, 0.69, 0.35] },
      { from: EWR, to: DCA, color: [0.8, 0.69, 0.35] },
      { from: PHL, to: YYZ, color: [0.4, 0.34, 0.17] },
      { from: YYZ, to: YYC, color: [0.4, 0.34, 0.17] },
      { from: YYC, to: EWR, color: [0.4, 0.34, 0.17] },
      { from: MDT, to: IAD, color: [0.4, 0.34, 0.17] },
      { from: IAD, to: SFO, color: [0.4, 0.34, 0.17] },
      { from: SFO, to: ORD, color: [0.4, 0.34, 0.17] },
      { from: ORD, to: MDT, color: [1.2, 1.03, 0.52] },
    ],
    arcColor: [1, 0.8588235294, 0.4392156863],
    arcWidth: 0.4,
    arcHeight: 0.35,
  });

  startGlobeAnimation();
}

canvas.addEventListener("mousedown", (event) => {
  isDragging = true;
  clearTimeout(resetTimer);
  isResetting = false;
  lastX = event.clientX;
  lastY = event.clientY;
});

canvas.addEventListener("touchstart", (event) => {
  isDragging = true;
  clearTimeout(resetTimer);
  isResetting = false;
  lastX = event.touches[0].clientX;
  lastY = event.touches[0].clientY;
});

window.addEventListener("mousemove", (event) => {
  if (!isDragging) return;
  const deltaX = event.clientX - lastX;
  const deltaY = event.clientY - lastY;
  velocityPhi = deltaX * 0.005;
  velocityTheta = deltaY * 0.005;
  phi += velocityPhi;
  theta += velocityTheta;
  lastX = event.clientX;
  lastY = event.clientY;
});

window.addEventListener("touchmove", (event) => {
  if (!isDragging) return;
  const deltaX = event.touches[0].clientX - lastX;
  const deltaY = event.touches[0].clientY - lastY;
  velocityPhi = deltaX * 0.005;
  velocityTheta = deltaY * 0.005;
  phi += velocityPhi;
  theta += velocityTheta;
  lastX = event.touches[0].clientX;
  lastY = event.touches[0].clientY;
});

function checkStop() {
  const stopThreshold = 0.02;
  if (
    Math.abs(velocityPhi) < stopThreshold &&
    Math.abs(velocityTheta) < stopThreshold
  ) {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      isResetting = true;
    }, 4000);
  } else {
    requestAnimationFrame(checkStop);
  }
}

window.addEventListener("mouseup", () => {
  isDragging = false;
  clearTimeout(resetTimer);
  isResetting = false;
  checkStop();
});

window.addEventListener("touchend", () => {
  isDragging = false;
  clearTimeout(resetTimer);
  isResetting = false;
  checkStop();
});

function getAnchorEl(id) {
  const wrap = canvas.parentElement;
  if (!wrap) return null;
  for (const el of wrap.children) {
    if (el !== canvas && el.style?.cssText.includes(`anchor-name:--cobe-${id}`)) {
      return el;
    }
  }
  return null;
}

function isCityVisible(id) {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--cobe-visible-${id}`)
      .trim() !== ""
  );
}

canvas.addEventListener("mousemove", (event) => {
  let nearAny = false;
  for (const id of CITY_IDS) {
    const label = document.querySelector(`.globe-label[data-city="${id}"]`);
    if (!isCityVisible(id)) {
      label?.classList.remove("globe-label--hover");
      continue;
    }
    const anchor = getAnchorEl(id);
    if (!anchor || !label) continue;
    const anchorRect = anchor.getBoundingClientRect();
    const dist = Math.hypot(
      event.clientX - anchorRect.left,
      event.clientY - anchorRect.top,
    );
    if (dist < 20) {
      label.classList.add("globe-label--hover");
      nearAny = true;
    } else {
      label.classList.remove("globe-label--hover");
    }
  }
  canvas.style.cursor = nearAny ? "pointer" : "";
});

canvas.addEventListener("mouseleave", () => {
  document.querySelectorAll(".globe-label").forEach((label) => {
    label.classList.remove("globe-label--hover");
  });
  canvas.style.cursor = "";
});

canvas.addEventListener("click", (event) => {
  for (const id of CITY_IDS) {
    if (!isCityVisible(id)) continue;
    const anchor = getAnchorEl(id);
    if (!anchor) continue;
    const anchorRect = anchor.getBoundingClientRect();
    if (Math.hypot(event.clientX - anchorRect.left, event.clientY - anchorRect.top) < 20) {
      const label = document.querySelector(`.globe-label[data-city="${id}"]`);
      if (label) label.classList.toggle("active");
      break;
    }
  }
});

document.querySelectorAll(".globe-label[data-city]").forEach((label) => {
  label.addEventListener("click", () => {
    label.classList.toggle("active");
  });
  label.addEventListener("mousemove", (event) => {
    const rect = label.getBoundingClientRect();
    label.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    label.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  });
});

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(initGlobe, 200);
});

document.addEventListener("pagechange", (event) => {
  if (event.detail?.page === "about") {
    startGlobeAnimation();
  } else {
    stopGlobeAnimation();
  }
});

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    aboutPage?.classList.contains("active")
  ) {
    startGlobeAnimation();
  }
});

function tryInit(retries) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 50) {
    initGlobe();
  } else if (retries > 0) {
    requestAnimationFrame(() => tryInit(retries - 1));
  }
}

requestAnimationFrame(() => tryInit(120));
