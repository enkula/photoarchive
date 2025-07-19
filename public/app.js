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

function renderTree(items, container, folderName = '') {
  const folder = document.createElement('div');
  folder.className = 'folder';

  if (folderName) {
    const title = document.createElement('h2');
    title.textContent = folderName;
    folder.appendChild(title);
  }

  const grid = document.createElement('div');
  grid.className = 'media-grid';

  items.forEach(item => {
    if (item.type === 'file') {
      const wrapper = document.createElement('div');
      wrapper.className = 'media-item';

      if (item.isVideo) {
        const preview = document.createElement('img');
        preview.src = item.thumbnail;
        preview.loading = 'lazy';
        preview.onclick = () => {
          const video = document.createElement('video');
          video.src = item.url;
          video.controls = true;
          video.autoplay = true;
          video.style.maxWidth = '200px';
          video.style.maxHeight = '150px';
          wrapper.innerHTML = '';
          wrapper.appendChild(video);
        };
        wrapper.appendChild(preview);
      } else {
        const img = document.createElement('img');
        img.src = item.thumbnail;
        img.loading = 'lazy';
        img.onclick = () => {
	  fullscreenImages.push(item);
	  const index = fullscreenImages.length - 1;
	  img.onclick = () => openFullscreenImage(index)
        };
        wrapper.appendChild(img);
      }

      grid.appendChild(wrapper);
    } else if (item.type === 'folder') {
      renderTree(item.items, container, item.name);
    }
  });

  if (grid.children.length > 0) {
    folder.appendChild(grid);
    container.appendChild(folder);
  }
}

function openFullscreenImage(index) {
  currentIndex = index;
  fullscreenViewer.innerHTML = '';
  const img = document.createElement('img');
  img.src = fullscreenImages[index].url;
  fullscreenViewer.appendChild(img);
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
