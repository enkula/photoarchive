const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { spawnSync } = require('child_process');
const { MEDIA_ROOT, THUMBNAIL_ROOT, THUMBNAIL_WIDTH } = require('./config');

const app = express();
const PORT = 3000;

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif'];
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi'];

app.use(express.static('public'));
app.use('/media', express.static(MEDIA_ROOT));
app.use('/thumbnails', express.static(THUMBNAIL_ROOT));

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getThumbnailPath(relPath, ext) {
  return path.join(THUMBNAIL_ROOT, relPath) + '.jpg';
}

function generateThumbnail(fullPath, relPath, ext) {
  const thumbPath = getThumbnailPath(relPath, ext);
  const thumbDir = path.dirname(thumbPath);
  ensureDirSync(thumbDir);
  if (fs.existsSync(thumbPath)) return;

  if (IMAGE_EXTS.includes(ext)) {
    sharp(fullPath)
      .resize({ width: THUMBNAIL_WIDTH })
      .jpeg()
      .toFile(thumbPath)
      .catch(err => console.error('Image thumb error:', err));
  } else if (VIDEO_EXTS.includes(ext)) {
    spawnSync('ffmpeg', [
      '-i', fullPath,
      '-ss', '00:00:01.000',
      '-vframes', '1',
      '-vf', `scale=${THUMBNAIL_WIDTH}:-1`,
      thumbPath
    ]);
  }
}

function scanDirRecursive(dir, base = '') {
  const result = [];

  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name);
    const ext = path.extname(entry.name).toLowerCase();

    if (entry.isDirectory()) {
      const children = scanDirRecursive(fullPath, relPath);
      if (children.length > 0) {
        result.push({ name: entry.name, type: 'folder', items: children });
      }
    } else if (IMAGE_EXTS.concat(VIDEO_EXTS).includes(ext)) {
      const stats = fs.statSync(fullPath);
      generateThumbnail(fullPath, relPath, ext);
      result.push({
        name: entry.name,
        type: 'file',
        url: `/media/${relPath}`,
        thumbnail: `/thumbnails/${relPath}.jpg`,
        isVideo: VIDEO_EXTS.includes(ext),
        date: stats.mtime.toISOString(),  // modification date in ISO format
        path: relPath
      });
    }
  });

  return result;
}

app.get('/api/media-tree', (req, res) => {
  try {
    const tree = scanDirRecursive(MEDIA_ROOT);
    res.json(tree);
  } catch (e) {
    res.status(500).json({ error: 'Failed to scan directory', details: e.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
