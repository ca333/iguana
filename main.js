//main proc for EasyDEX GUI
//this app spawns iguana in background in nontech-mode

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
var express = require('express')
var bodyParser = require('body-parser')
const path = require('path')
const url = require('url')
const os = require('os')
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
var fs = require('fs');
var fs = require('fs-extra')
var mkdirp = require('mkdirp');
var pm2 = require('pm2');
Promise = require('bluebird');

var appConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.setName('Iguana');

if (os.platform() === 'linux') {
  process.env.ELECTRON_RUN_AS_NODE = true
  console.log(process.env);
}

// preload.js
const _setImmediate = setImmediate
const _clearImmediate = clearImmediate
process.once('loaded', () => {
  global.setImmediate = _setImmediate
  global.clearImmediate = _clearImmediate
  if (os.platform() === 'darwin') { process.setFdLimit(90000); }
  if (os.platform() === 'linux') { process.setFdLimit(1000000); }
})

// GUI APP settings and starting gui on address http://120.0.0.1:17777
var shepherd = require('./routes/shepherd');

var guiapp = express()
guiapp.use(bodyParser.json()); // support json encoded bodies
guiapp.use(bodyParser.urlencoded({ extended: false })); // support encoded bodies

guiapp.get('/', function (req, res) {
  res.send('Hello World!')
})

var guipath = path.join(__dirname, '/gui')
guiapp.use('/gui', express.static(guipath))

guiapp.use('/shepherd', shepherd);

var rungui = guiapp.listen(17777, function () {
  console.log('guiapp listening on port 17777!')
})

module.exports = guiapp;
// END GUI App Settings


//require('./assets/js/iguana.js'); //below code shall be separated into asset js for public version
/*
// SELECTING IGUANA BUILD TO RUN AS PER OS DETECTED BY DESKTOP APP
var iguanaOSX = path.join(__dirname, '/assets/bin/osx/iguana');
var iguanaLinux = path.join(__dirname, '/assets/bin/linux64/iguana');
var iguanaWin = path.join(__dirname, '/assets/bin/win64/iguana.exe'); iguanaWin = path.normalize(iguanaWin);
var iguanaConfsDirSrc = path.join(__dirname, '/assets/deps/confs');

// SETTING OS DIR TO RUN IGUANA FROM
// SETTING APP ICON FOR LINUX AND WINDOWS
if (os.platform() === 'darwin') {
  var iguanaDir = process.env.HOME + '/Library/Application Support/iguana';
  var iguanaConfsDir = iguanaDir + '/confs';
}
if (os.platform() === 'linux') {
  var iguanaDir = process.env.HOME + '/.iguana'
  var iguanaConfsDir = iguanaDir + '/confs';
  var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon_png/128x128.png')
}
if (os.platform() === 'win32') {
  var iguanaDir = process.env.APPDATA + '/iguana'; iguanaDir = path.normalize(iguanaDir)
  var iguanaConfsDir = process.env.APPDATA + '/iguana/confs'; iguanaConfsDir = path.normalize(iguanaConfsDir)
  var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon.ico')
  iguanaConfsDirSrc = path.normalize(iguanaConfsDirSrc);
}
*/

if (os.platform() === 'linux') { var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon_png/128x128.png') }
if (os.platform() === 'win32') { var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon.ico') }

//console.log(iguanaDir);
/*
// MAKE SURE IGUANA DIR IS THERE FOR USER
mkdirp(iguanaDir, function (err) {
  if (err)
    console.error(err)
  else
    fs.readdir(iguanaDir, (err, files) => {
      files.forEach(file => {
        //console.log(file);
      });
    })
});

// COPY CONFS DIR WITH PEERS FILE TO IGUANA DIR, AND KEEP IT IN SYNC
fs.copy(iguanaConfsDirSrc, iguanaConfsDir, function (err) {
  if (err) return console.error(err)
  console.log('confs files copied successfully at: '+ iguanaConfsDir )
})
*/

let mainWindow
let loadingWindow


function createLoadingWindow() {
  mainWindow = null;

  // initialise window
  loadingWindow = new BrowserWindow({width: 500, height: 300, frame: false, icon: iguanaIcon})

  // load our index.html (i.e. easyDEX GUI)
  loadingWindow.loadURL('http://127.0.0.1:17777/gui/');

  // DEVTOOLS - only for dev purposes - ca333
  //loadingWindow.webContents.openDevTools()

  // if window closed we kill iguana proc
  loadingWindow.on('hide', function () {
    // our app does not have multiwindow - so we dereference the window object instead of
    // putting them into an window_arr
    loadingWindow = null
    createWindow('open')
  })

  //ca333 todo - add os detector to use correct binary - so we can use the same bundle on ALL OS platforms
  /*if (os.platform() === 'win32') {
    process.chdir(iguanaDir);
    //exec(iguanaWin, {cwd: iguanaDir}); //specify binary in startup
    ig = spawn(iguanaWin);
  }
  if (os.platform() === 'linux') {
    process.chdir(iguanaDir);
    ig = spawn(iguanaLinux);
    //corsproxy_process = spawn('corsproxy');
  }
  if (os.platform() === 'darwin') {
    //process.chdir(iguanaDir);
    //ig = spawn(iguanaOSX);
    //corsproxy_process = spawn('corsproxy');
  }*/

  //if (os.platform() !== 'win32') { ig.stderr.on( 'error: ', data => { console.log( `stderr: ${data}` ); }); }
}

app.on('ready', createLoadingWindow)

function createWindow (status) {
  if ( status === 'open') {

    require(path.join(__dirname, 'private/mainmenu'));

    // initialise window
    mainWindow = new BrowserWindow({width: 1280, height: 800, icon: iguanaIcon})

    // load our index.html (i.e. easyDEX GUI)
    if (appConfig.edexGuiOnly) {
      mainWindow.loadURL('http://127.0.0.1:17777/gui/EasyDEX-GUI/');
    } else {
      mainWindow.loadURL('http://127.0.0.1:17777/gui/main.html');
    }

    // DEVTOOLS - only for dev purposes - ca333
    //mainWindow.webContents.openDevTools()

    // if window closed we kill iguana proc
    mainWindow.on('closed', function () {
      var ConnectToPm2 = function() {

          return new Promise(function(resolve, reject) {
              console.log('Closing Main Window...');

              pm2.connect(true,function(err) {
                  console.log('connecting to pm2...');
                  if (err) {
                      console.log(err);
                  }
              });

              var result = 'Connecting To Pm2: done'

              console.log(result)
              resolve(result);
          })
      }

      var KillPm2 = function() {

          return new Promise(function(resolve, reject) {
              console.log('killing to pm2...');

              pm2.killDaemon(function(err) {
                  pm2.disconnect();
                  console.log('killed to pm2...');
                  if (err) throw err
              });

              var result = 'Killing Pm2: done'

              setTimeout(function() {
                  console.log(result)
                  resolve(result);
              }, 2000)
          })
      }

      var HideMainWindow = function() {

          return new Promise(function(resolve, reject) {
              console.log('Exiting App...');
              mainWindow = null

              var result = 'Hiding Main Window: done'
              console.log(result)
              resolve(result);
          })
      }

      var QuitApp = function() {

          return new Promise(function(resolve, reject) {
              app.quit();
              var result = 'Quiting App: done'
              console.log(result)
              resolve(result);
          })
      }

      ConnectToPm2()
      .then(function(result) {
          return KillPm2();
      })
      .then(HideMainWindow)
      .then(QuitApp)
    });
  }
}

//app.on('ready', function() {
  //createLoadingWindow
//})

app.on('window-all-closed', function () {
    //if (os.platform() !== 'win32') { ig.kill(); }
  // in osx apps stay active in menu bar until explictly closed or quitted by CMD Q
  // so we do not kill the app --> for the case user clicks again on the iguana icon
  // we open just a new window and respawn iguana proc
  /*if (process.platform !== 'darwin' || process.platform !== 'linux' || process.platform !== 'win32') {
    app.quit()
  }*/

})

//Emitted before the application starts closing its windows.
//Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('before-quit', function (event) {
  if (mainWindow === null && loadingWindow != null) { //mainWindow not intitialised and loadingWindow not dereferenced
    //loading window is still open
    console.log("before-quit prevented");
    event.preventDefault();
  }
})

//Emitted when all windows have been closed and the application will quit.
//Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('will-quit', function (event) {
  if (mainWindow === null && loadingWindow != null) {
    //loading window is still open
    console.log("will-quit while loading window active");
    event.preventDefault();
  }
})

//Emitted when the application is quitting.
//Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('quit', function (event) {
  if (mainWindow === null && loadingWindow != null) {
    console.log("quit while loading window active");
    event.preventDefault();
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    //createWindow('open');
  }
})
