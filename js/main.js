const SEEK_URL = "https://raw.githubusercontent.com/acervos-digitais/oito-um-utils/main/metadata/0801-1152/seek.json";

const VIDEOS_URL = "/videos/0801-500";
const IMAGES_URL = "/images/0801-500";

const DATE_STRING_OPTIONS = {
  weekday: 'short',
  month: 'short',
  year: 'numeric',
  day: '2-digit',
  timeZoneName: 'longOffset',
};

const CAM2NAMES = {
  "01-COBERTURA-PP-OESTE": "General View (West)",
  "02-COBERTURA-ENTRADA-PR": "General View of Presidency Entrance",
  "03-ENTRADA-PP-RAIO-X-TERREO": "Ground Floor (Presidency Entrance X-Ray)",
  "04-PALACIO-ALA-LESTE-TERREO": "Ground Floor (East)",
  "05-PALACIO-ALA-OESTE": "Ground Floor (West)",
  "06-PRIVATIVO-COMBOIO": "Private Convoy",
  "07-SALA-PG-3-PISO": "3rd Floor - President's Personal Office",
  "08-SUBSOLO-ADM": "Basement (Administrative)",
  "09-ELEVADOR-DE-SERVICO-TERREO": "Ground Floor - Service Elevator",
  "10-SALAO-NOBRE": "Ground Floor - Noble Hall",
  "11-SALAO-OESTE": "Ground Floor - West Hall",
  "12-2o-ANDAR-RAMPA": "2nd Floor - Ramp",
  "13-2o-ANDAR-ELEVADOR-LESTE": "2nd Floor - East Elevator",
  "14-2o-ANDAR-ELEVADOR-OESTE": "2nd Floor - East West Elevator",
  "15-MESANINO": "Mezzanine",
  "16-CAMERA-VIP-PR": "Ground Floor - President's Entrance",
  "17-3o-ANDAR-SALA-PR": "3rd Floor - President's Office",
  "18-3o-ANDAR-SALA-DE-AUDIENCIA": "3rd Floor - Audience Room",
  "19-3o-ANDAR-CORREDOR-ACESSO-LESTE": "3rd Floor - Access Corridor (East)",
  "20-ELEVADORES-ALA-OESTE": "4th Floor Elevators (West)",
  "21-2o-ANDAR-ESCADA-OESTE": "2nd Floor Stairs (West)",
  "22-3o-ANDAR-ESCADA-OESTE": "3rd Floor Stairs (West)",
  "23-ELEVADOR-MINISTROS": "3rd Floor - Ministers' Elevator",
  "24-4o-ANDAR-ELEVADOR-LESTE": "4th Floor - Elevator (East)",
  "25-4o-ANDAR-ESCADA-OESTE": "4th Floor - Stairs (West)",
  "26-4o-ANDAR-ELEVADOR-OESTE": "4th Floor - Elevator (West)",
  "27-4o-ANDAR-LADO-LESTE": "4th Floor (East)",
  "28-4o-ANDAR-LADO-OESTE": "4th Floor (West)",
  "29-ANEXO-I": "Annex I",
  "30-ANEXO-I-ENTRADA-PRINCIPAL-CATRACAS": "Annex I - Main Entrance (Turnstiles)",
  "31-ANEXO-I-CONCHA-ANEXO": "Annex I - Entrance (External)",
  "32-ANEXO-III-REFEITORIO-CREDEN": "Annex III Accredited Cafeteria",
  "33-ANEXO-III-REFEITORIO": "Annex III - Cafeteria",
}

const minDate = new Date("2023-01-08T00:00:00-03:00");
const maxDate = new Date("2023-01-08T23:59:59-03:00");

const NUM_VIDS = 33;

const SECONDS_PER_DAY = 24 * 60 * 60;
const FRAME_PERIOD_SECONDS = 15 * 60;

const BY_TIME = window.location.pathname.endsWith("/time/") || window.location.pathname.endsWith("/time");

function getGridDims(numVideos) {
  const videoArea = (window.innerWidth * window.innerHeight) / numVideos;
  const dimFactor = (videoArea / (16 * 9)) ** 0.5;
  const numCols = Math.round(window.innerWidth / (16 * dimFactor));
  const numRows = Math.ceil(numVideos / numCols);
  return [numCols, numRows];
}

function populateCameraPicker(el, options) {
  options.toSorted().forEach(o => {
    const oEl = document.createElement("option");
    oEl.classList.add("camera-option");
    oEl.value = o;
    if (o == Object.keys(CAM2NAMES)[4]) {
      oEl.setAttribute("selected", "");
    }
    oEl.innerHTML = CAM2NAMES[o];
    el.appendChild(oEl);
  });
}

function populateTimePicker(el, optionList) {
  optionList.forEach(i => {
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

let [NUM_COLS, NUM_ROWS] = getGridDims(NUM_VIDS);

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

async function fetchData(mUrl) {
  const response = await fetch(mUrl);
  return await response.json();
}

document.addEventListener("DOMContentLoaded", async (_) => {
  const seekData = await fetchData(SEEK_URL);

  const navTitleEl = document.getElementById("navigation-title");
  const navContainerEl = document.getElementById("navigation-container");
  const videoContainerEl = document.getElementById("video-container");
  const pickerHourEl = document.getElementById("hour-picker");
  const pickerMinuteEl = document.getElementById("minute-picker");
  const pickerCameraEl = document.getElementById("camera-picker");
  const navTypeEl = document.getElementById("navigation-type-value");
  const imgEls = document.getElementsByClassName("image-container");

  const overlayEl = document.getElementById("overlay");
  const overlayVideoEl = document.getElementById("overlay-video");
  const overlayVideoSrcEl = document.getElementById("overlay-video-source");

  if (BY_TIME) {
    navTypeEl.innerHTML = "Navigate By Time";
    pickerCameraEl.style.display = "none";
  } else {
    navTypeEl.innerHTML = "Navigate By Location";
    pickerHourEl.style.display = "none";
    pickerMinuteEl.style.display = "none";
  }

  overlayEl.addEventListener("click", () => {
    overlayEl.classList.remove("visible");

    overlayVideoEl.pause();
    overlayVideoSrcEl.setAttribute("src", "");
    overlayVideoEl.load();
  });

  overlayVideoEl.addEventListener("click", (ev) => {
    ev.stopPropagation();
  });

  const videoContainerHeight = window.innerHeight - navContainerEl.clientHeight - navTitleEl.clientHeight;
  videoContainerEl.style.height = BY_TIME ? `${videoContainerHeight}px` : `${3*videoContainerHeight}px`;

  populateCameraPicker(pickerCameraEl, Object.keys(seekData));
  populateHourPicker(pickerHourEl);
  populateMinutePicker(pickerMinuteEl);
  pickerHourEl.value = 0;
  pickerMinuteEl.value = 0;

  function updateVideos(getTimestamp, getCamera) {
    Array.from(imgEls).forEach((mDiv) => {
      const mTimestamp = getTimestamp(mDiv);
      const mCamera = getCamera(mDiv);
      const { fileName, position } = findFilenamePosition(mTimestamp)(seekData[mCamera]);

      const mImg = mDiv.getElementsByClassName("image-image")[0];
      const imgSrc = `${IMAGES_URL}/${mCamera}/${Math.floor(mTimestamp)}.jpg`;
      mImg.style.backgroundImage = "";
      if (fileName != "") {
        mImg.style.backgroundImage = `url('${imgSrc}')`;
      }

      const videoSrc = mDiv.getAttribute("data-src");
      const newVideoSrc = `${VIDEOS_URL}/${fileName}`;

      if (newVideoSrc != videoSrc) {
        mDiv.setAttribute("data-src", "");
        mDiv.removeAttribute("data-position");
        if (fileName != "") {
          mDiv.setAttribute("data-src", newVideoSrc);
          mDiv.setAttribute("data-position", position);
        }
      } else {
        if (position != -1) {
          mDiv.setAttribute("data-position", position);
        }
      }
    });
  }

  function updateVideosByTime(currentTimestamp) {
    updateVideos((_) => currentTimestamp, (e) => e.getAttribute("data-camera"));
  }

  function updateVideosByCamera(camera) {
    updateVideos((e) => e.getAttribute("data-timestamp"), (_) => camera);
  }

  videoContainerEl.innerHTML = "";
  const cameras = Object.keys(seekData);

  const numElements = BY_TIME ? NUM_VIDS : SECONDS_PER_DAY / FRAME_PERIOD_SECONDS;
  for (let i = 0; i < numElements; i++) {
    const mDiv = document.createElement("div");
    const mImg = document.createElement("div");

    mDiv.classList.add("image-container");
    mDiv.setAttribute("data-camera", cameras[i]);
    mDiv.setAttribute("data-timestamp", offsetToTimestamp(i * FRAME_PERIOD_SECONDS));
    mDiv.style.width = `${100 / NUM_COLS}%`;
    mDiv.style.maxHeight = `${100 / NUM_ROWS}%`;

    mDiv.addEventListener("click", (_) => {
      const vidSrc = mDiv.getAttribute("data-src");
      const vidPos = mDiv.getAttribute("data-position");

      overlayVideoSrcEl.setAttribute("src", vidSrc);
      overlayVideoEl.currentTime = vidPos;
      overlayVideoEl.load();

      overlayEl.classList.add("visible");
    });

    mImg.classList.add("image-image");

    mDiv.appendChild(mImg);
    videoContainerEl.appendChild(mDiv);
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
    updateVideosByCamera(ev.target.value,);
    ev.target.blur();
  });
});
