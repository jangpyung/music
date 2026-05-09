const fs = require('fs');
const path = require('path');

const baseUrl = 'https://jangpyung.github.io/music';
const songsFile = path.join(__dirname, 'songs.json');
const shareDir = path.join(__dirname, 'share');

if (!fs.existsSync(shareDir)) {
  fs.mkdirSync(shareDir);
}

const songs = JSON.parse(fs.readFileSync(songsFile, 'utf-8'));

songs.forEach((song, i) => {
  const no = i + 1;
  // Ensure cover url is absolute
  let coverUrl = song.cover;
  if (coverUrl.startsWith('./')) {
    coverUrl = baseUrl + coverUrl.substring(1);
  } else if (!coverUrl.startsWith('http')) {
    coverUrl = baseUrl + '/' + coverUrl;
  }
  
  const shareUrl = baseUrl + '/share/' + no + '.html';
  
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${song.title} - 장평 배드민턴클럽</title>
  
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${song.title} - ${song.artist}" />
  <meta property="og:description" content="장평 배드민턴클럽 공식 음악 앨범" />
  <meta property="og:image" content="${coverUrl}" />
  <meta property="og:url" content="${shareUrl}" />
  
  <meta http-equiv="refresh" content="0; url=../index.html?no=${no}">
  <script>
    window.location.replace("../index.html?no=${no}");
  </script>
</head>
<body>
  <p>이동 중입니다... <a href="../index.html?no=${no}">여기를 클릭하세요</a></p>
</body>
</html>`;

  fs.writeFileSync(path.join(shareDir, no + '.html'), html, 'utf-8');
});
console.log('Share pages built successfully.');
