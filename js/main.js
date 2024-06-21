const OBJS_URL = "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/objects-1152/objects.json";
const SEEK_URL = "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/0801-1152/seek.json";

const VIDEOS_URL = "//digitais.acervos.me/videos/0801-500";
const IMAGES_URL = "//digitais.acervos.me/images/0801-500";

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

document.addEventListener("DOMContentLoaded", async (_) => {
  const mUrl = location.href;
  Array.from(document.getElementsByTagName("a")).forEach(a => {
    const aRef = a.getAttribute("href");
    if (mUrl.slice(-5) == aRef.slice(-5)) {
      a.removeAttribute("href");
      a.classList.add("disabled");
    }
  });
});
