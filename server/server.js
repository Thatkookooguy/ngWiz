const express = require('express');
const path = require('path');
const compression = require('compression');
const childProcess = require('child_process');

const app = express();
const STATIC_FILES_LOCATION = path.join(__dirname, '..', '/dist/Angular-cli-ui');
const PORT = 3000;

let isOpenBrowser;

process.argv.forEach(function (val, index, array) {
  if (val === '-o') {
    isOpenBrowser = true;
  }
});

app.use(compression());
app.use(express.static(STATIC_FILES_LOCATION));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get('/', function(req, res) {
  res.sendFile(`${STATIC_FILES_LOCATION}/index.html`);
});

app.post('/command', function(req, res) {
  if (req.body.folder) {       // to make sure folder is received 
    process.chdir(req.body.folder);
  }

  commandEvent = childProcess.exec(req.body.command, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });

  commandEvent.stdout.on('data', function(data) {
    console.log(data); 
  });

  res.send('thanks for this data');  
});

app.listen(PORT, () => {
  console.clear();
  console.log(`Listening on port ${PORT}!`);
  if (isOpenBrowser) {
    openBrowser(PORT);
  }
});

function openBrowser(port) {
  const url = `http://localhost:${port}`;
  const start = process.platform === 'darwin'? 'open': process.platform === 'win32'? 'start': 'xdg-open';

  childProcess.exec(`${start} ${url}`);
}
