const SEEK_URL =
  "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/0801-1152-crop-64/seek.json";

const minDate = new Date("2023-01-08T00:00:00-03:00");
const maxDate = new Date("2023-01-08T23:59:59-03:00");

function timestampToText(ts) {
  const mDate = new Date(0);
  mDate.setUTCSeconds(ts);
  return mDate.toString();
}

function findFilename(ts) {
  return function (tsl) {
    for (let [ts0, ts1, vidName] of tsl) {
      if (ts >= ts0 && ts <= ts1) {
        return vidName;
      }
    }
    return "";
  };
}

async function fetchData() {
  const response = await fetch(SEEK_URL);
  return await response.json();
}

document.addEventListener("DOMContentLoaded", async (_) => {
  window.seekData = await fetchData();

  const videosEl = document.getElementsByClassName("video-container")[0];
  const sliderEl = document.getElementById("timestamp-slider");
  const timestampEl = document.getElementById("timestamp-value");

  sliderEl.setAttribute("min", `${minDate.getTime() / 1000}`);
  sliderEl.setAttribute("max", `${maxDate.getTime() / 1000}`);
  sliderEl.setAttribute("value", `${minDate.getTime() / 1000}`);

  timestampEl.innerHTML = timestampToText(sliderEl.value);

  sliderEl.addEventListener("input", (ev) => {
    const mts = ev.target.value;
    timestampEl.innerHTML = timestampToText(mts);

    const fileNames = Object.values(window.seekData.ranges).map(
      findFilename(ev.target.value)
    );

    const positions = fileNames.map((fileName) => {
      if (fileName == "") return -1;

      const mSeeks = window.seekData.seeks[fileName];
      // TODO:
      // find in seek
      // loadVideo
      // when loaded, seek
    });
  });

  const seekKeys = Object.keys(window.seekData);
  videosEl.innerHTML = seekKeys;
  // TODO:
  // populate <video> tags
});
