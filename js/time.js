const DATE_STRING_OPTIONS = {
  weekday: "short",
  month: "short",
  year: "numeric",
  day: "2-digit",
  timeZoneName: "longOffset",
};

const minDate = new Date("2023-01-08T00:00:00-03:00");
const maxDate = new Date("2023-01-08T23:59:59-03:00");

const SECONDS_PER_DAY = 24 * 60 * 60;
const FRAME_PERIOD_SECONDS = 15 * 60;
const PERIODS_PER_DAY = SECONDS_PER_DAY / FRAME_PERIOD_SECONDS;

const PATHNAME = window.location.pathname;
const BY_TIME = PATHNAME.endsWith("/time/") || PATHNAME.endsWith("/time");

const NUM_IMAGES = BY_TIME ? NUM_VIDS : PERIODS_PER_DAY;

function populateCameraPicker(el, options) {
  options.toSorted().forEach((o) => {
    const oEl = document.createElement("option");
    oEl.classList.add("camera-option");
    oEl.value = o;
    if (o == Object.keys(CAM2NAMES[lang()])[4]) {
      oEl.setAttribute("selected", "");
    }
    oEl.innerHTML = CAM2NAMES[lang()][o];
    el.appendChild(oEl);
  });
}

function populateTimePicker(el, optionList) {
  optionList.forEach((i) => {
    const oEl = document.createElement("option");
    oEl.classList.add("time-option");
    oEl.value = i;
    oEl.innerHTML = `0${i}`.slice(-2);
    el.appendChild(oEl);
  });
}

function populateHourPicker(el) {
  const hours = [...Array(24).keys()];
  populateTimePicker(el, hours);
}

function populateMinutePicker(el) {
  const minutes = [0, 10, 15, 20, 30, 40, 45, 50];
  populateTimePicker(el, minutes);
}

function offsetToTimestamp(offsetSecs) {
  const mDate = new Date(minDate);
  mDate.setUTCSeconds(offsetSecs);
  return mDate.getTime() / 1000;
}

function timeToTimestamp(timeString) {
  const mDate = new Date(minDate);
  const hourMinutes = timeString.split(":").map((v) => parseInt(v));

  mDate.setUTCSeconds(hourMinutes[0] * 3600 + hourMinutes[1] * 60);
  return mDate.getTime() / 1000;
}

function timestampToText(ts) {
  const mDate = new Date(0);
  mDate.setUTCSeconds(ts);
  return mDate.toLocaleString("en-us", DATE_STRING_OPTIONS);
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

function createImageElement(camera, tsOffset) {
  const imgContainerEl = document.createElement("div");
  const imgEl = document.createElement("img");

  imgContainerEl.classList.add("image-wrapper");
  imgEl.classList.add("image-image");

  imgContainerEl.setAttribute("data-camera", camera);
  imgContainerEl.setAttribute("data-timestamp", offsetToTimestamp(tsOffset));
  imgContainerEl.style.width = `${100 / NUM_COLS}%`;

  imgContainerEl.appendChild(imgEl);
  return imgContainerEl;
}

document.addEventListener("DOMContentLoaded", async (_) => {
  const seekData = await fetchData(SEEK_URL);

  const imagesEl = document.getElementById("images-container");
  const pickerHourEl = document.getElementById("hour-picker");
  const pickerMinuteEl = document.getElementById("minute-picker");
  const pickerCameraEl = document.getElementById("camera-picker");
  const imgWrappers = document.getElementsByClassName("image-wrapper");

  if (BY_TIME) {
    pickerCameraEl.style.display = "none";
  } else {
    pickerHourEl.style.display = "none";
    pickerMinuteEl.style.display = "none";
  }

  populateCameraPicker(pickerCameraEl, Object.keys(seekData));
  populateHourPicker(pickerHourEl);
  populateMinutePicker(pickerMinuteEl);
  pickerHourEl.value = 0;
  pickerMinuteEl.value = 0;

  function updateVideos(getTimestamp, getCamera) {
    Array.from(imgWrappers).forEach((mDiv) => {
      const mTimestamp = getTimestamp(mDiv);
      const mCamera = getCamera(mDiv);
      const mData = seekData[mCamera];
      const { fileName, position } = findFilenamePosition(mTimestamp)(mData);

      const imgSrc = `${IMAGES_URL}/${mCamera}/${Math.floor(mTimestamp)}.jpg`;
      const videoSrc = `${VIDEOS_URL}/${fileName}`;

      const mImg = mDiv.getElementsByClassName("image-image")[0];
      mImg.src = fileName == "" ? "" : imgSrc;
      mImg.style.height = fileName == "" ? "0" : "initial";

      mDiv.style.maxHeight = `${(mImg.offsetWidth * 9) / 16}px`;

      mDiv.setAttribute("data-video-src", videoSrc);
      mDiv.setAttribute("data-video-seek", position);
    });
  }

  function updateVideosByTime(currentTimestamp) {
    updateVideos(
      (_) => currentTimestamp,
      (e) => e.getAttribute("data-camera")
    );
  }

  function updateVideosByCamera(camera) {
    updateVideos(
      (e) => e.getAttribute("data-timestamp"),
      (_) => camera
    );
  }

  imagesEl.innerHTML = "";
  const cameras = Object.keys(seekData);

  for (let i = 0; i < NUM_IMAGES; i++) {
    const mImgEl = createImageElement(cameras[i], i * FRAME_PERIOD_SECONDS);
    imagesEl.appendChild(mImgEl);
    mImgEl.addEventListener("click", loadOverlay);
  }

  if (BY_TIME) {
    const timeStr = `${pickerHourEl.value}:${pickerMinuteEl.value}`;
    updateVideosByTime(timeToTimestamp(timeStr));
  } else {
    updateVideosByCamera(pickerCameraEl.value);
  }

  const updateByTime = (ev) => {
    const timeStr = `${pickerHourEl.value}:${pickerMinuteEl.value}`;
    updateVideosByTime(timeToTimestamp(timeStr));
    ev.target.blur();
  };
  pickerHourEl.addEventListener("input", updateByTime);
  pickerMinuteEl.addEventListener("input", updateByTime);

  pickerCameraEl.addEventListener("input", (ev) => {
    updateVideosByCamera(ev.target.value);
    ev.target.blur();
  });
});
