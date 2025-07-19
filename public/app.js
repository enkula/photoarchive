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
          window.open(item.url, '_blank');
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

loadGallery();
