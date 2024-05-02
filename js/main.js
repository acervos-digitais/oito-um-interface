const SEEK_URL =
  "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/0801-1152-crop-64/seek.json";

const VIDEOS_URL = "https://pro-probable-goblin.ngrok-free.app/0801-500";

const minDate = new Date("2023-01-08T00:00:00-03:00");
const maxDate = new Date("2023-01-08T23:59:59-03:00");

const NUM_VIDS = 8;
const CAMERA_OFFSET = 5;
const PER_ROW = Math.floor(NUM_VIDS ** (9 / 16));
const NUM_ROWS = Math.ceil(NUM_VIDS / PER_ROW);

function timeToTimestamp(timeString) {
  const mDate = new Date(minDate);
  const hourMinutes = timeString.split(":").map((v) => parseInt(v));

  mDate.setUTCSeconds(hourMinutes[0] * 3600 + hourMinutes[1] * 60);
  return mDate.getTime() / 1000;
}

function timestampToText(ts) {
  const mDate = new Date(0);
  mDate.setUTCSeconds(ts);
  return mDate.toString();
}

function timestampToPosition(ts, ts0, ts1, pos0, pos1) {
  return ((ts - ts0) / (ts1 - ts0)) * (pos1 - pos0) + pos0;
}

function findFilenamePosition(ts) {
  return function ({ camera, ranges, seeks, ..._ }) {
    let fileName = "";
    let position = -1;

    for (let [ts0, ts1, fName] of ranges) {
      if (ts >= ts0 && ts <= ts1) {
        fileName = fName;
        break;
      }
    }

    if (fileName == "") return { fileName, position };

    const fileSeeks = seeks[fileName];
    let [ts0, pos0] = fileSeeks[0];
    for (let i = 1; i < fileSeeks.length; i++) {
      const [ts1, pos1] = fileSeeks[i];
      if (ts >= ts0 && ts <= ts1) {
        position = timestampToPosition(ts, ts0, ts1, pos0, pos1);
        break;
      } else {
        [ts0, pos0] = fileSeeks[i];
      }
    }

    return { fileName: `${camera}/${fileName}`, position };
  };
}

async function fetchData() {
  const response = await fetch(SEEK_URL);
  return await response.json();
}

document.addEventListener("DOMContentLoaded", async (_) => {
  const seekData = await fetchData();

  const videoContainerEl = document.getElementById("video-container");
  const pickerEl = document.getElementById("timestamp-picker");
  const videoEls = document.getElementsByClassName("video");

  pickerEl.setAttribute("value", "00:00");

  function updateVideos(currentTimestamp) {
    const timestampEl = document.getElementById("timestamp-value");
    timestampEl.innerHTML = timestampToText(currentTimestamp);

    Array.from(videoEls).forEach((mVid) => {
      const mCamera = mVid.getAttribute("data-camera");
      const mSrc = mVid.getElementsByClassName("video-source")[0];

      mVid.pause();
      mVid.removeAttribute("data-position");
      mSrc.setAttribute("src", "");
      mVid.load();

      const { fileName, position } = findFilenamePosition(currentTimestamp)(
        seekData[mCamera]
      );

      if (fileName != "") {
        mSrc.setAttribute("src", `${VIDEOS_URL}/${fileName}`);
        mVid.setAttribute("data-position", position);
        mVid.load();
      }
    });

    // const filesAndPositions = Object.values(seekData).map(
    //   findFilenamePosition(currentTimestamp)
    // );
    // console.log(filesAndPositions);
  }

  videoContainerEl.innerHTML = "";
  const cameras = Object.keys(seekData);

  for (let i = 0; i < NUM_VIDS; i++) {
    const cIdx = (CAMERA_OFFSET + i) % cameras.length;
    const mVid = document.createElement("video");
    const mSrc = document.createElement("source");

    mVid.classList.add("video");
    mVid.setAttribute("data-camera", cameras[cIdx]);
    mVid.setAttribute("playsinline", "");
    mVid.setAttribute("muted", "");
    mVid.style.width = `${100 / PER_ROW}%`;

    mVid.addEventListener("loadeddata", (ev) => {
      // console.log("loaded", cameras[cIdx]);
      const vidEl = ev.target;
      vidEl.currentTime = vidEl.getAttribute("data-position") || 0;
    });

    mVid.addEventListener("seeked", (ev) => {
      // console.log("seeked", cameras[cIdx]);
      ev.target.play();
      ev.target.pause();
    });

    mSrc.classList.add("video-source");
    mSrc.setAttribute("src", "");
    mSrc.setAttribute("type", "video/mp4");

    mVid.appendChild(mSrc);
    videoContainerEl.appendChild(mVid);
  }

  updateVideos(timeToTimestamp(pickerEl.value));

  pickerEl.addEventListener("input", (ev) => {
    updateVideos(timeToTimestamp(ev.target.value));
    ev.target.blur();
  });
});
