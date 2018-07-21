const express = require('express');
const path = require('path');
const compression = require('compression');
const childProcess = require('child_process');
const fs = require('fs');

const app = express();
const STATIC_FILES_LOCATION = path.join(__dirname, '..', '/dist/Angular-cli-ui');
const PORT = 3000;

let isOpenBrowser;
class ProcessRunner {
  constructor() {
    this.runningProcesses = {};
  }

  static guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  run(currentProcess) {
    let isError = false;
    this.runningProcesses[currentProcess.id] = {
      process: null,
      status: 'working'
    };
    this.runningProcesses[currentProcess.id].process = childProcess.exec(currentProcess.params, currentProcess.callback);

    this.runningProcesses[currentProcess.id].process.stdout.on('data', (data) => {
      console.log(data);
    });

    this.runningProcesses[currentProcess.id].process.stderr.on('error', (error) => {
      console.log("???????????????????????????????????????");
      isError = true;
    })
  
    this.runningProcesses[currentProcess.id].process.stdout.on('close', () => {
      if (isError) {
        this.runningProcesses[currentProcess.id].status = 'error';
      } else {
        this.runningProcesses[currentProcess.id].status = 'done';
        if (currentProcess.params.toString().includes(' new ')){
          const commandValues = currentProcess.params.toString().split(' ');
          const projectName = commandValues[2];
          process.chdir(`${process.cwd()}\\${projectName}`);
        }
      }
      console.log("###################################################################################");
    })

  }
}

process.argv.forEach((val, index, array) => {
  if (val === '-o') {
    isOpenBrowser = true;
  }
});

const processRunner = new ProcessRunner();

app.use(compression());
app.use(express.static(STATIC_FILES_LOCATION));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  res.sendFile(`${STATIC_FILES_LOCATION}/index.html`);
});

app.get('/isAngularProject', (req, res) => {
  const file = 'angular.json';
  
  fs.access(file, fs.constants.F_OK, (err) => {
    res.send(err ? false : true);
  });
});

app.get('/status', (req, res) => {
  const id = req.query.id;

  if (processRunner.runningProcesses[id]) {
    const processStatus = processRunner.runningProcesses[id].status;
    res.send({status: processStatus});
    if (processStatus == 'done') {
      processRunner.runningProcesses[id] = null;
    }
  } else {
    res.sendStatus(404);
  }
});

app.post('/command', (req, res) => {
  try {
    const callback = (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        return;
      }
    }

    const currentProcess = {
      id: ProcessRunner.guid(),
      callback: callback,
      params: req.body.command
    }
    
    processRunner.run(currentProcess);
    res.send(currentProcess.id);  
  }
  catch(error) {
    console.log(error);
    res.status(400).end();
  }
});

//this function will help us in development using Postman to change the working directory
app.post('/DEVchangeDir', (req, res) => {
  process.chdir(req.body.folder);
  res.send(`Working directory chaged to: ${process.cwd()}`);
})

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
