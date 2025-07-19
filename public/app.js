let fullscreenImages = [];
let currentIndex = 0;
const fullscreenViewer = document.getElementById('fullscreen-viewer');

async function loadGallery() {
  const res = await fetch('/api/media-tree')
	.then(res => res.json())
	.then(data => {
	  const groupedTree = groupMediaByDateRecursively(data);
	  renderTree(groupedTree, document.getElementById('gallery'));
	})
	.catch(console.error);
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

  // Create info container
  const infoDiv = document.createElement('div');
  infoDiv.style.color = 'white';
  infoDiv.style.padding = '10px 20px';
  infoDiv.style.position = 'absolute';
  infoDiv.style.top = '10px';
  infoDiv.style.left = '50%';
  infoDiv.style.transform = 'translateX(-50%)';
  infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  infoDiv.style.borderRadius = '6px';
  infoDiv.style.fontSize = '1rem';
  infoDiv.style.zIndex = '10000';
  infoDiv.style.maxWidth = '90vw';
  infoDiv.style.textAlign = 'center';

  
  // Show full path and date (assuming item has 'path' and 'date' properties)
  // If you don't have full path, you can build it or add to your data
  const displayPath = item.path || item.name; // fallback to name if no path
  const displayDate = item.date ? new Date(item.date).toLocaleString('fi-FI') : 'Unknown date';

  infoDiv.textContent = `${displayPath} — ${displayDate}`;

  fullscreenViewer.appendChild(infoDiv);
  
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

function groupMediaByDateRecursively(items) {
  // Separate files and folders
  const files = items.filter(i => i.type === 'file');
  const folders = items.filter(i => i.type === 'folder');

  // Group files by date
  const dateGroups = {};
  files.forEach(file => {
    if (!file.date) {
      // If no date, fallback group
      if (!dateGroups['No Date']) dateGroups['No Date'] = [];
      dateGroups['No Date'].push(file);
    } else {
      const dateKey = file.date.slice(0, 10); // 'YYYY-MM-DD'
      if (!dateGroups[dateKey]) dateGroups[dateKey] = [];
      dateGroups[dateKey].push(file);
    }
  });

  // Convert dateGroups to folder-like objects
  const groupedDateFolders = Object.entries(dateGroups).map(([date, items]) => ({
    name: date,
    type: 'folder',
    items,
  }));

  // Recurse on subfolders
  const processedFolders = folders.map(folder => ({
    ...folder,
    items: groupMediaByDateRecursively(folder.items),
  }));

  // Return combined array: date folders + original folders
  return [...groupedDateFolders, ...processedFolders];
}

loadGallery();
