const SEEK_URL =
  "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/0801-1152-crop-64/seek.json";

const minDate = new Date("2023-01-08T00:00:00-03:00");
const maxDate = new Date("2023-01-08T23:59:59-03:00");

const NUM_VIDS = 8;
const PER_ROW = Math.floor(NUM_VIDS ** (9 / 16));

function timestampToText(ts) {
  const mDate = new Date(0);
  mDate.setUTCSeconds(ts);
  return mDate.toString();
}

function timestampToPosition(ts, ts0, ts1, pos0, pos1) {
  return ((ts - ts0) / (ts1 - ts0)) * (pos1 - pos0) + pos0;
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

function findPosition(ts) {
  return function (tsl) {
    let [ts0, pos0] = tsl[0];
    for (let i = 1; i < tsl.length; i++) {
      const [ts1, pos1] = tsl[i];
      if (ts >= ts0 && ts <= ts1) {
        return timestampToPosition(ts, ts0, ts1, pos0, pos1);
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
  const seekData = await fetchData();

  const videosEl = document.getElementById("video-container");
  const sliderEl = document.getElementById("timestamp-slider");

  sliderEl.setAttribute("min", `${minDate.getTime() / 1000}`);
  sliderEl.setAttribute("max", `${maxDate.getTime() / 1000}`);
  sliderEl.setAttribute("value", `${minDate.getTime() / 1000}`);

  function updateVideos(currentTimestamp) {
    const timestampEl = document.getElementById("timestamp-slider-value");
    timestampEl.innerHTML = timestampToText(currentTimestamp);

    const fileNames = Object.values(seekData.ranges).map(
      findFilename(currentTimestamp)
    );

    const positions = fileNames.map((fileName, idx) => {
      const mVid = document.getElementById(`video-${idx}`);
      const mSrc = document.getElementById(`video-source-${idx}`);

      if (mVid) {
        mVid.pause();
        mVid.removeAttribute("data-position");
      }

      if (fileName == "") return -1;

      const mPos = findPosition(currentTimestamp)(seekData.seeks[fileName]);

      if (mVid) {
        mSrc.setAttribute("src", fileName);
        mVid.setAttribute("data-position", mPos);
        mVid.load();
      }

      return mPos;
    });

    // console.log(fileNames);
    // console.log(positions);
  }

  videosEl.innerHTML = "";
  for (let i = 0; i < NUM_VIDS; i++) {
    const mVid = document.createElement("video");
    const mSrc = document.createElement("source");

    mVid.id = `video-${i}`;
    mVid.classList.add("video");
    mVid.setAttribute("playsinline", "");
    mVid.setAttribute("muted", "");
    mVid.style.width = `${100 / PER_ROW}%`;

    mVid.addEventListener("loadeddata", (ev) => {
      console.log("loadeddata");
      const vidEl = ev.target;
      vidEl.currentTime = vidEl.getAttribute("data-position") || 0;
    });

    mVid.addEventListener("seeked", (ev) => {
      console.log("seeked");
      ev.target.play();
      ev.target.pause();
    });

    mSrc.id = `video-source-${i}`;
    mSrc.setAttribute("src", "");
    mSrc.setAttribute("type", "video/mp4");

    mVid.appendChild(mSrc);
    videosEl.appendChild(mVid);
  }

  updateVideos(sliderEl.value);

  sliderEl.addEventListener("input", (ev) => {
    updateVideos(ev.target.value);
  });
});
