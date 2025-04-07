const { app, BrowserWindow, ipcMain } = require('electron');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

let mainWindow;
let serverAddress = "Hypixel.net";
let topkamcid = "hypixel-net.6";
let serwerymcid = "1122-hypixel-net";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1350,
    height: 725,
    icon: path.join(__dirname, 'icons/logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.setMinimumSize(960, 625);

  mainWindow.loadFile('index.html');
  mainWindow.setMenu(null);
  mainWindow.setIcon(path.join(__dirname, 'icons/logo.png'));
  mainWindow.on('closed', () => {
    mainWindow = null;
});
}

function addCustomRow(status, label, statusColor, duration = 800) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  mainWindow.webContents.executeJavaScript(`
    try {
      const tbody = document.getElementById('last-stats');
      if (!tbody) throw new Error('tbody for last-stats not found');
      
      const newRow = document.createElement('tr');
      newRow.className = 'h-12';
      newRow.innerHTML = \`
        <td>${status}</td>
        <td>${label}</td>
        <td>
          <div class="status-bar-container">
            <div class="status-bar" style="background-color: ${statusColor};"></div>
          </div>
        </td>
      \`;
      
      const statusBar = newRow.querySelector('.status-bar');

      // Ustawienie czasu trwania animacji na podstawie parametru 'duration'
      statusBar.style.transitionDuration = '${duration}ms';
      
      // Inicjalizacja wypełniania paska
      setTimeout(() => {
        statusBar.style.width = '100%';
      }, 20);

      tbody.insertBefore(newRow, tbody.firstChild);
    } catch (err) {}
  `).catch((err) => {});
}


function clearDNS() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(`
    try {
      const tbody = document.getElementById('scan-server-dns');
      if (!tbody) throw new Error('scan-server-dns not found');
      while (tbody.rows.length > 0) {
        tbody.deleteRow(0);
      }
    } catch (err) {
      console.error('clearRows error:', err);
    }
  `).catch((err) => {});
}

function addScanDNS(hostname, type, dns) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!dns) {
    dns = "None";
  }
  
  mainWindow.webContents.executeJavaScript(`
    try {
      const tbody = document.getElementById('scan-server-dns');
      if (!tbody) throw new Error('scan-server-dns not found');
      
      const newRow = document.createElement('tr');
      newRow.style.backgroundColor = '#2e2e2e';
      newRow.style.borderRadius = '0.5rem';
      newRow.style.marginBottom = '0.5rem';
      
      newRow.innerHTML = \`
        <td style="padding: 0.5rem; padding-left: 1rem; border-radius: 0.5rem 0 0 0.5rem;">${hostname}</td>
        <td style="padding: 0.5rem;">${type}</td>
        <td style="padding: 0.5rem; padding-right: 1rem; border-radius: 0 0.5rem 0.5rem 0;">${dns}</td>
      \`;
      
      const spacerRow = document.createElement('tr');
      spacerRow.innerHTML = '<td colspan="3" style="height: 0rem;"></td>';
      
      tbody.insertBefore(spacerRow, tbody.firstChild);
      tbody.insertBefore(newRow, spacerRow);
    } catch (err) {}
  `).catch((err) => {});
}


function ServerPingAnimation() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  mainWindow.webContents.executeJavaScript(`
    try {
      const progressBar = document.getElementById('progress-bar');
      if (!progressBar) throw new Error('Progress bar not found');

      function animateProgress() {
        progressBar.style.transition = 'width 0s linear';
        progressBar.style.width = '0%';

        setTimeout(() => {
          progressBar.style.transition = 'width 29.85s ease-in-out';
          progressBar.style.width = '100%';
        }, 100);
      }
      animateProgress();
    } catch (err) {}
  `).catch((err) => {});
}

ipcMain.on('button-clicked', (event, buttonId) => {
  getLikes(buttonId, false, "");
});
ipcMain.on('spoof-start', (event, data) => {
  let list = "None";
  if (data.selectedList == "mclist") {
    list = "mc-list-button";
  }
  addCustomRow('Success', 'Started Spoof', '#26d4ff', 700);
  fetchServerData("Spoof", data.serverIP);
  getLikes(list, true, data.serverIP);
});

ipcMain.on('start-scanning', (event, data) => {
  addCustomRow('Success', 'Started Scan', '#ffff21', 700);
  fetchServerData("Scan", data.serverIP);
});

async function getLikes(listData, spoof, ip) {
  try {
      mainWindow.webContents.executeJavaScript(`
        try {
            document.getElementById('server-likes').innerText = '?';
        } catch (err) {}
    `);
      let serverLikes = '';
      let serverIP = serverAddress;
      if (ip !== "") {
        serverIP = ip;
      }
      if (listData == "mc-list-button") {
        const { data } = await axios.get(`https://www.mclist.pl/serwer/${serverIP}`);
        const $ = cheerio.load(data);
        serverLikes = $("body > header > main > div.container > div > div.col-lg-4.col-md-12.mb-lg-0.mt-3.mb-4 > div > div > div.row.mt-3 > div:nth-child(2) > button").text().trim();  
      }
      if (listData == "topka-mc-button") {
        const { data } = await axios.get(`https://www.topkamc.pl/serwer/${topkamcid}`);
        const $ = cheerio.load(data);
        serverLikes = $("#vote-positive-value").text().trim();  
      }
      if (listData == "mc-lista-button") {
        const { data } = await axios.get(`https://minecraft-lista.pl/szukaj?query=${serverIP}`);
        const $ = cheerio.load(data);
        serverLikes = $("body > div.container.mx-auto > div.row.flex-wrap.justify-content-center > div.mt-3.position-relative.col-lg-6.col-md-12 > div > div.server-right.d-flex.justify-content-between.align-items-end > div.d-flex.justify-content-end > div.ms-2.d-flex.justify-content-end.align-items-center").text().trim();  
      }
      if (listData == "serwery-mc-button") {
        const { data } = await axios.get(`https://serwery-minecraft.pl/serwer/${serwerymcid}`);
        const $ = cheerio.load(data);
        const small = $("a[title='Oddaj głos na serwer'] > small");
        small.contents().each(function () {
          if (this.type === 'text') {
            const text = $(this).text().trim();
            if (text && /^\d+$/.test(text)) {
              serverLikes = text;
            }
          }
        });
      }
      serverLikes = serverLikes ?? '?';
      if (serverLikes == "" ) {
        serverLikes = "?";
      }
      if (spoof == true) {
        addCustomRow('Success', 'Spoof Server', '#26d4ff', 1500);
        mainWindow.webContents.executeJavaScript(`
          try {
              document.getElementById('spoof-serverlikes').innerText = '${serverLikes}';
          } catch (err) {}
      `);
      } else {
        addCustomRow('Success', 'Likes', '#ffb833', 1300);
        mainWindow.webContents.executeJavaScript(`
          try {
              document.getElementById('server-likes').innerText = '${serverLikes}';
          } catch (err) {}
      `);
      }
  } catch (error) {}
}

function fetchServerData(todo, ip) {
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  };
  if (ip == "") {
    if (todo != "Scan") {
      ip = serverAddress;
    }
  }
  https.get(`https://api.mcsrvstat.us/3/${ip}`, options, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (response.statusCode === 200) {
        try {
          const parsedData = JSON.parse(data);
          if (todo == "Scan") {
            clearDNS();
            if (parsedData.debug.dns && parsedData.debug.dns.srv) {
              parsedData.debug.dns.srv.forEach((item, index) => {
                let scanDNSData = "None"
                if (data.priority) {
                  scanDNSData = `${priority} ${weight} ${port} ${target}`
                } else if (data.signname) {
                  scanDNSData = `${data.signname}`
                }
                addScanDNS(item.name, item.type, scanDNSData);
              });
              parsedData.debug.dns.srv_a.forEach((item, index) => {
                let scanDNSData = "None"
                if (item.address) {
                  scanDNSData = item.address;
                }
                addScanDNS(item.name, item.type, scanDNSData);
              });
            }
          }
          if (parsedData) {
            addCustomRow('Success', 'Ping', '#ff54f1');
            if (todo == "Scan") {
              if (parsedData.ip != "127.0.0.1") {
                addCustomRow('Success', 'Server Scan', '#ffff21', 1500);
              } else {
                addCustomRow('Failed', 'Server Scan', '#ff4a4a', 1500);
                return;
              }
            }
            ServerPingAnimation();
            if (todo == "Spoof") {
              mainWindow.webContents.executeJavaScript(`
                try {
                  document.getElementById('spoof-server-status').innerText = '${parsedData.online ? 'Online' : 'Offline'}';
                  document.getElementById('spoof-server-name').innerText = '${ip}';
                  document.getElementById('spoof-server-address').innerText = '${parsedData.ip}:${parsedData.port}';
                  document.getElementById('spoof-motd1').innerHTML = ${JSON.stringify(parsedData.motd?.html?.[0] ?? "")};
                  document.getElementById('spoof-motd2').innerHTML = ${JSON.stringify(parsedData.motd?.html?.[1] ?? "")};
                  const icon = ${JSON.stringify(parsedData.icon)};
                  if (icon) {
                    document.getElementById('spoof-server-logo').src = icon;
                  }
                } catch (err) {}
              `);
            } else if (todo == "Scan") {
              mainWindow.webContents.executeJavaScript(`
                try {
                  document.getElementById('scan-server-status').innerText = '${parsedData.online ? 'Online' : 'Offline'}';
                  document.getElementById('scan-server-name').innerText = '${ip}';
                  document.getElementById('scan-server-address').innerText = '${parsedData.ip}:${parsedData.port}';
                  document.getElementById('scan-motd1').innerHTML = ${JSON.stringify(parsedData.motd?.html?.[0] ?? "")};
                  document.getElementById('scan-motd2').innerHTML = ${JSON.stringify(parsedData.motd?.html?.[1] ?? "")};
              
                  const icon = ${JSON.stringify(parsedData.icon)};
                  if (icon) {
                    document.getElementById('scan-server-logo').src = icon;
                  }
                  const onlinePlayersElement = document.querySelector('.scan-online-players');
                  onlinePlayersElement.innerText = '${parsedData.players.online}/${parsedData.players.max}';
                } catch (err) {}
              `);              
            } else {
              mainWindow.webContents.executeJavaScript(`
                try {
                  document.getElementById('server-status').innerText = '${parsedData.online ? 'Online' : 'Offline'}';
                  document.getElementById('server-name').innerText = '${ip}';
                  document.getElementById('server-name2').innerText = '${ip}';
                  document.getElementById('server-address').innerText = '${parsedData.ip}:${parsedData.port}';
                  document.getElementById('motd1').innerHTML = ${JSON.stringify(parsedData.motd.html[0])};
                  document.getElementById('motd2').innerHTML = ${JSON.stringify(parsedData.motd.html[1])};                  
                  const icon = ${JSON.stringify(parsedData.icon)};
                  if (icon) {
                    document.getElementById('server-logo').src = icon;
                  }
                  } catch (err) {}
              `);
              
              
            }
          } else {
            addCustomRow('Failed', 'Ping', '#ff4a4a', 1500);
          }
        } catch (error) {
          addCustomRow('Failed', 'Ping', '#ff4a4a', 1500);
        }
      } else {
        addCustomRow('Failed', 'Ping', '#ff4a4a', 1500);
      }
    });
  }).on('error', (error) => {
    addCustomRow('Error', 'Ping', '#ff4a4a', 1500);
  });
}

app.whenReady().then(() => {
    createWindow();
    addCustomRow('Success', 'Loaded', '#4ade80', 500);
    mainWindow.webContents.executeJavaScript(`
        document.body.style.userSelect = 'none';
    `);
    getLikes("mc-list-button", false, "");

  mainWindow.webContents.on('did-finish-load', () => {
    fetchServerData("Nothing", serverAddress);
    setInterval(() => {
        fetchServerData("Nothing", serverAddress);
    }, 30000);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
