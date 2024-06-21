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

const SECONDS_PER_DAY = 24 * 60 * 60;
const FRAME_PERIOD_SECONDS = 15 * 60;

const BY_TIME = window.location.pathname.endsWith("/time/") || window.location.pathname.endsWith("/time");

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

  const overlayEl = document.getElementById("overlay");
  const overlayVideoEl = document.getElementById("overlay-video");
  const overlayVideoSrcEl = document.getElementById("overlay-video-source");

  if (BY_TIME) {
    pickerCameraEl.style.display = "none";
  } else {
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

  populateCameraPicker(pickerCameraEl, Object.keys(seekData));
  populateHourPicker(pickerHourEl);
  populateMinutePicker(pickerMinuteEl);
  pickerHourEl.value = 0;
  pickerMinuteEl.value = 0;

  function updateVideos(getTimestamp, getCamera) {
    Array.from(imgWrappers).forEach((mDiv) => {
      const mTimestamp = getTimestamp(mDiv);
      const mCamera = getCamera(mDiv);
      const { fileName, position } = findFilenamePosition(mTimestamp)(seekData[mCamera]);

      const imgSrc = `${IMAGES_URL}/${mCamera}/${Math.floor(mTimestamp)}.jpg`;
      const videoSrc = `${VIDEOS_URL}/${fileName}`;

      const mImg = mDiv.getElementsByClassName("image-image")[0];
      mImg.src = (fileName == "") ? "" : imgSrc;
      mImg.style.height = (fileName == "") ? "0" : "initial";

      mDiv.style.maxHeight = `${mImg.offsetWidth * 9 / 16}px`;

      mDiv.setAttribute("data-video-src", videoSrc);
      mDiv.setAttribute("data-video-seek", position);
    });
  }

  function updateVideosByTime(currentTimestamp) {
    updateVideos((_) => currentTimestamp, (e) => e.getAttribute("data-camera"));
  }

  function updateVideosByCamera(camera) {
    updateVideos((e) => e.getAttribute("data-timestamp"), (_) => camera);
  }

  imagesEl.innerHTML = "";
  const cameras = Object.keys(seekData);

  const numElements = BY_TIME ? NUM_VIDS : SECONDS_PER_DAY / FRAME_PERIOD_SECONDS;
  for (let i = 0; i < numElements; i++) {
    const mImgEl = createImageElement(cameras[i], i * FRAME_PERIOD_SECONDS);
    imagesEl.appendChild(mImgEl);

    mImgEl.addEventListener("click", (_) => {
      const vidSrc = mImgEl.getAttribute("data-video-src");
      const vidPos = mImgEl.getAttribute("data-video-seek");

      overlayVideoSrcEl.setAttribute("src", vidSrc);
      overlayVideoEl.currentTime = vidPos;

      if (vidPos >= 0) {
        overlayVideoEl.load();
        overlayEl.classList.add("visible");
      }
    });
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
