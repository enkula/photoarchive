let fullscreenImages = [];
let currentIndex = 0;
const fullscreenViewer = document.getElementById('fullscreen-viewer');

async function loadGallery() {
  const res = await fetch('/api/media-tree');
  const data = await res.json();
  const container = document.getElementById('gallery');
  container.innerHTML = '';
  renderTree(data, container);
}

function renderTree(items, container) {
  fullscreenImages = []; // Reset on every render

  function recurseRender(items, parent) {
    items.forEach((item) => {
      if (item.type === 'file') {
        // Add image to fullscreenImages list
        fullscreenImages.push(item);
        const index = fullscreenImages.length - 1;

        // Create thumbnail img element
        const img = document.createElement('img');
        img.src = item.thumbnail;
        img.alt = item.name;
        img.classList.add('thumbnail');
	
        // Attach click to open fullscreen with index in full list
        img.onclick = () => openFullscreenImage(index);

        parent.appendChild(img);

      } else if (item.type === 'folder') {
        // Create folder container (optional UI)
        const folderDiv = document.createElement('div');
        folderDiv.classList.add('folder');
        folderDiv.textContent = item.name;
        parent.appendChild(folderDiv);

        // Recurse into folder
        recurseRender(item.items, folderDiv);
      }
    });
  }

  container.innerHTML = ''; // Clear container before render
  recurseRender(items, container);
}

function openFullscreenImage(index) {
  currentIndex = index;
  fullscreenViewer.innerHTML = '';
  const item = fullscreenImages[index];

  if (item.type === 'video' || item.url.match(/\.(mp4|webm|ogg)$/i)) {
    // Create video element
    const video = document.createElement('video');
    video.src = item.url;
    video.controls = true;
    video.autoplay = true;
    video.style.maxWidth = '90%';
    video.style.maxHeight = '90%';
    fullscreenViewer.appendChild(video);
  } else {
    // Create image element
    const img = document.createElement('img');
    img.src = item.url;
    fullscreenViewer.appendChild(img);
  }

  fullscreenViewer.style.display = 'flex';
  document.addEventListener('keydown', onKeyDown);
}


function closeFullscreen() {
  fullscreenViewer.style.display = 'none';
  document.removeEventListener('keydown', onKeyDown);
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    closeFullscreen();
  } else if (e.key === 'PageUp') {
    showRelativeImage(-1);
  } else if (e.key === 'PageDown') {
    showRelativeImage(1);
  }
  e.preventDefault()
}

function showRelativeImage(direction) {
  currentIndex = (currentIndex + direction + fullscreenImages.length) % fullscreenImages.length;
  openFullscreenImage(currentIndex);
}

// Swipe support
let touchX = 0;
fullscreenViewer.addEventListener('touchstart', e => {
  touchX = e.changedTouches[0].clientX;
});
fullscreenViewer.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) {
    showRelativeImage(dx < 0 ? 1 : -1);
  }
});

// Close fullscreen on tap
fullscreenViewer.addEventListener('click', closeFullscreen);


loadGallery();
