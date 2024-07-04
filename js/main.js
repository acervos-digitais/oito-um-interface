const OBJS_URL = "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/objects-1152/objects.json";
const SEEK_URL = "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/0801-1152/seek.json";

const VIDEOS_URL = "//digitais.acervos.me/videos/0801-500";
const IMAGES_URL = "//digitais.acervos.me/images/0801-500";

function lang() {
  let mlang = localStorage.getItem('0801lang');
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

let loadOverlay;

function populateNavMenu() {
  const mUrl = location.href;
  const titleEl = document.getElementById("navigation-title");
  const navMenuEl = document.getElementById("navigation-menu");
  const navLinkEls = navMenuEl.querySelectorAll("[data-slug]");

  titleEl.innerHTML = DAYSTRING[lang()];

  navLinkEls.forEach(a => {
    const aRef = a.getAttribute("href");
    const aSlug = a.getAttribute("data-slug");

    if (mUrl.slice(-5) == aRef.slice(-5)) {
      a.removeAttribute("href");
      a.classList.add("disabled");
    }
    a.innerHTML = MENUTEXT[lang()][aSlug];
  })
}

document.addEventListener("DOMContentLoaded", async (_) => {
  populateNavMenu();

  const overlayEl = document.getElementById("overlay");
  const overlayVideoEl = document.getElementById("overlay-video");
  const overlayVideoSrcEl = document.getElementById("overlay-video-source");

  overlayEl.addEventListener("click", () => {
    overlayEl.classList.remove("visible");
    document.body.removeEventListener("wheel", prevDef);

    overlayVideoEl.pause();
    overlayVideoSrcEl.setAttribute("src", "");
    overlayVideoEl.load();
  });

  overlayVideoEl.addEventListener("click", (ev) => {
    ev.stopPropagation();
  });

  loadOverlay = (ev) => {
    const vidSrc = ev.currentTarget.getAttribute("data-video-src");
    const vidPos = ev.currentTarget.getAttribute("data-video-seek");

    overlayVideoSrcEl.setAttribute("src", vidSrc);
    overlayVideoEl.currentTime = vidPos;

    if (vidPos >= 0) {
      overlayVideoEl.load();
      overlayEl.classList.add("visible");
      document.body.addEventListener("wheel", prevDef, { passive: false });
    }
  };
});
