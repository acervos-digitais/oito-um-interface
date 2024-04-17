const SEEK_URL =
  "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/0801-1152-crop-64/seek.json";

const minDate = new Date("2023-01-08T00:00:00-03:00");
const maxDate = new Date("2023-01-08T23:59:59-03:00");

function timestampToText(ts) {
  const mDate = new Date(0);
  mDate.setUTCSeconds(ts);
  return mDate.toString();
}

async function fetchSeek() {
  const response = await fetch(SEEK_URL);
  return await response.json();
}

document.addEventListener("DOMContentLoaded", async (_) => {
  window.seekData = await fetchSeek();

  const videosEl = document.getElementsByClassName("video-container")[0];
  const sliderEl = document.getElementById("timestamp-slider");
  const timestampEl = document.getElementById("timestamp-value");

  sliderEl.setAttribute("min", `${minDate.getTime() / 1000}`);
  sliderEl.setAttribute("max", `${maxDate.getTime() / 1000}`);
  sliderEl.setAttribute("value", `${minDate.getTime() / 1000}`);

  timestampEl.innerHTML = timestampToText(sliderEl.value);

  sliderEl.addEventListener("input", (ev) => {
    timestampEl.innerHTML = timestampToText(ev.target.value);
    // TODO:
    // find videos and timestamps of current slider time
    //   load new video
    //   seek to position
  });

  const seekKeys = Object.keys(window.seekData);
  console.log(seekKeys);
  videosEl.innerHTML = seekKeys;
  // TODO:
  // populate <video> tags
});
