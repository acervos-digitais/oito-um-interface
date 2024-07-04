function createImageElement(frameData, obs) {
  const imgWrapperEl = document.createElement("div");
  const imgEl = document.createElement("img");
  const imgTextEl = document.createElement("p");

  imgWrapperEl.classList.add("image-wrapper");
  imgEl.classList.add("image-image");
  imgTextEl.classList.add("no-image-text");

  imgWrapperEl.setAttribute("data-video-src", `${VIDEOS_URL}/${frameData.file}`);
  imgWrapperEl.setAttribute("data-video-seek", frameData.time);

  imgWrapperEl.innerHTML = "Loading...";
  imgWrapperEl.style.width = `${100 / NUM_COLS}%`;

  const cname = frameData.file.replace(/\/.+$/, "");
  const fname = `${Math.floor(frameData.timestamp)}.jpg`;
  const imgSrc = `${IMAGES_URL}/${cname}/${fname}`;

  imgTextEl.innerHTML = NOIMAGE[lang()];

  imgWrapperEl.innerHTML = "";
  imgWrapperEl.appendChild(imgEl);
  imgWrapperEl.appendChild(imgTextEl);
  imgEl.src = imgSrc;

  if (obs) {
    mObserver.observe(imgWrapperEl);
  }

  return imgWrapperEl;
}

let mObserver = null;
let cFrames = [];
let cFrameIdx = 0;

document.addEventListener("DOMContentLoaded", async (_) => {
  const frameData = await fetchData(OBJS_URL);

  const selInputEl = document.getElementById("selection-container");
  const imagesEl = document.getElementById("images-container");

  frameOnscreen = (entries, _) => {
    entries.forEach((entry) => {
      const eEl = entry.target;
      if (entry.isIntersecting) {
        mObserver.unobserve(eEl);
        cFrameIdx = loadFrames(cFrames, cFrameIdx);
      }
    });
  };

  mObserver = new IntersectionObserver(frameOnscreen, {
    threshold: 0.01,
  });

  function loadFrames(frames, startIdx, numFrames = 10) {
    const lastIdx = Math.min(startIdx + numFrames, frames.length);
    for (let i = startIdx; i < lastIdx; i++) {
      const mImgEl = createImageElement(frames[i], i == lastIdx - 2);
      imagesEl.appendChild(mImgEl);

      mImgEl.style.maxHeight = `${(mImgEl.offsetWidth * 9) / 16}px`;

      mImgEl.addEventListener("click", loadOverlay);
    }
    return lastIdx;
  }

  function updateVideosByObject(cObject) {
    imagesEl.innerHTML = "";
    cFrames = frameData.objects[cObject].map((fi) => {
      const mF = { ...frameData.frames[fi] };
      mF.file = frameData.files[mF.file];
      return mF;
    });

    cFrameIdx = loadFrames(cFrames, 0);
  }

  Object.keys(frameData.objects).forEach((o) => {
    const optButEl = document.createElement("button");
    optButEl.classList.add("object-option-button");
    optButEl.setAttribute("data-option", o);
    optButEl.innerHTML = OBJ2LABEL[lang()][o];

    optButEl.addEventListener("click", (ev) => {
      selInputEl.childNodes.forEach((e) => e.classList.remove("selected"));

      const el = ev.target;
      el.classList.add("selected");
      const selObj = el.getAttribute("data-option");
      updateVideosByObject(selObj);
    });
    selInputEl.appendChild(optButEl);
  });
});
