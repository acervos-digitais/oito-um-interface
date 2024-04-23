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

function tsToPos(ts, ts0, ts1, pos0, pos1) {
  return ((ts - ts0)/(ts1 - ts0)) * (pos1 - pos0) + pos0;
};

function findPosition(ts) {
  return function (tsl) {
    let [ts0, pos0] = tsl[0];
    for (let i = 1; i < tsl.length; i++) {
      const [ts1, pos1] = tsl[i];
      if (ts >= ts0 && ts <= ts1) {
        return tsToPos(ts, ts0, ts1, pos0, pos1);
      } else {
        [ts0, pos0] = tsl[i];
      }
    }
    return -1;
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
      findFilename(mts)
    );

    const positions = fileNames.map((fileName) => {
      if (fileName == "") return -1;
      const mPos = findPosition(mts)(window.seekData.seeks[fileName]);
      // TODO:
      // load fileName
      // when loaded, seek
      return mPos;
    });
  });

  const seekKeys = Object.keys(window.seekData);
  videosEl.innerHTML = seekKeys;
  // TODO:
  // populate <video> tags
});
