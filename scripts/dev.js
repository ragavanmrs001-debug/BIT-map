const { spawn, exec } = require('child_process');

function openBrowser(url) {
  const start =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
      ? 'start'
      : 'xdg-open';

  exec(`${start} ${url}`, (err) => {
    if (err) {
      console.log(`\nTo view GeoBITs, open your browser at: ${url}`);
    }
  });
}

// Start next dev
const nextDev = spawn('npx', ['next', 'dev'], {
  shell: true,
});

let browserOpened = false;

nextDev.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);

  // Match URL from Next.js output: "Local: http://localhost:3000" or similar
  const urlMatch = text.match(/https?:\/\/localhost:\d+/);
  if (urlMatch && !browserOpened) {
    browserOpened = true;
    const url = urlMatch[0];
    console.log(`\n🚀 Opening ${url} in your browser...`);
    setTimeout(() => openBrowser(url), 500);
  }
});

nextDev.stderr.on('data', (data) => {
  process.stderr.write(data);
});

nextDev.on('close', (code) => {
  process.exit(code || 0);
});
