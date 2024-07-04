const OBJS_URL = "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/objects-1152/objects.json";
const SEEK_URL = "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/0801-1152/seek.json";

const VIDEOS_URL = "//digitais.acervos.me/videos/0801-500";
const IMAGES_URL = "//media.acervos.me/images/0801-500";

function lang() {
  let mlang = localStorage.getItem("0801lang");
  if (!mlang) {
    localStorage.setItem("0801lang", "en");
    return "en";
  } else {
    return mlang;
  }
}

function getGridDims(numVideos) {
  const videoArea = (window.innerWidth * window.innerHeight) / numVideos;
  const dimFactor = (videoArea / (16 * 9)) ** 0.5;
  const numCols = Math.round(window.innerWidth / (16 * dimFactor));
  const numRows = Math.ceil(numVideos / numCols);
  return [numCols, numRows];
}
const NUM_VIDS = 33;
const [NUM_COLS, NUM_ROWS] = getGridDims(NUM_VIDS);

async function fetchData(mUrl) {
  const response = await fetch(mUrl);
  return await response.json();
}

const prevDef = (ev) => ev.preventDefault();
const stopProp = (ev) => ev.stopPropagation();

let loadOverlay;

function populateNavMenu() {
  const mUrl = location.href;
  const titleEl = document.getElementById("navigation-title");
  const navMenuEl = document.getElementById("navigation-menu");
  const navLinkEls = navMenuEl.querySelectorAll("[data-slug]");

  titleEl.innerHTML = DAYSTRING[lang()];

  navLinkEls.forEach((a) => {
    const aRef = a.getAttribute("href");
    const aSlug = a.getAttribute("data-slug");

    if (mUrl.slice(-5) == aRef.slice(-5)) {
      a.removeAttribute("href");
      a.classList.add("disabled");
    }
    a.innerHTML = MENUTEXT[lang()][aSlug];
  });
}

function setupVideoOverlay() {
  const vidOverlayEl = document.getElementById("video-overlay");
  const overlayVideoEl = document.getElementById("overlay-video");
  const overlayVideoSrcEl = document.getElementById("overlay-video-source");

  vidOverlayEl.addEventListener("click", () => {
    vidOverlayEl.classList.remove("visible");
    document.body.removeEventListener("wheel", prevDef);

    overlayVideoEl.pause();
    overlayVideoSrcEl.setAttribute("src", "");
    overlayVideoEl.load();
  });

  overlayVideoEl.addEventListener("click", stopProp);

  loadOverlay = (ev) => {
    const vidSrc = ev.currentTarget.getAttribute("data-video-src");
    const vidPos = ev.currentTarget.getAttribute("data-video-seek");

    overlayVideoSrcEl.setAttribute("src", vidSrc);
    overlayVideoEl.currentTime = vidPos;

    if (vidPos >= 0) {
      overlayVideoEl.load();
      vidOverlayEl.classList.add("visible");
      document.body.addEventListener("wheel", prevDef, { passive: false });
    }
  };
}

function setupAboutOverlay() {
  const aboutOverlayEl = document.getElementById("about-overlay");
  const overlayAboutEl = document.getElementById("overlay-about");
  const aboutLinkEl = document.getElementById("about-link");

  aboutOverlayEl.addEventListener("click", () => {
    aboutOverlayEl.classList.remove("visible");
    document.body.removeEventListener("wheel", prevDef);
  });

  overlayAboutEl.addEventListener("click", stopProp);

  aboutLinkEl.addEventListener("click", () => {
    aboutOverlayEl.classList.add("visible");
    overlayAboutEl.innerHTML = ABOUTTEXT[lang()];
    document.body.addEventListener("wheel", prevDef, { passive: false });
  });
}

document.addEventListener("DOMContentLoaded", async (_) => {
  populateNavMenu();
  setupVideoOverlay();
  setupAboutOverlay();
});
