const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Session store for event-based logs per channel
const MAX_LOGS = 500;
const sessionStore = new Map();

// Pending invoke requests waiting for responses
const pendingInvokes = new Map();

function getSessionData(channelId) {
  if (!sessionStore.has(channelId)) {
    sessionStore.set(channelId, {
      networkLogs: [],
      consoleLogs: [],
      timelineLogs: []
    });
  }
  return sessionStore.get(channelId);
}

function addNetworkLog(channelId, log) {
  const data = getSessionData(channelId);
  data.networkLogs.push(log);
  while (data.networkLogs.length > MAX_LOGS) {
    data.networkLogs.shift();
  }
}

function addConsoleLog(channelId, log) {
  const data = getSessionData(channelId);
  data.consoleLogs.push(log);
  while (data.consoleLogs.length > MAX_LOGS) {
    data.consoleLogs.shift();
  }
}

function addTimelineLog(channelId, log) {
  const data = getSessionData(channelId);
  // Insert in sorted order by startTime
  const i = data.timelineLogs.findIndex(v => v.startTime > log.startTime);
  if (i < 0) {
    data.timelineLogs.push(log);
  } else {
    data.timelineLogs.splice(i, 0, log);
  }
  while (data.timelineLogs.length > MAX_LOGS) {
    data.timelineLogs.shift();
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Add CORS headers to all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Let Next.js handle the request
    handler(req, res);
  });

  const io = new Server(httpServer, {
    path: '/wavepulse/socket.io',
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Invoke a method on the mobile app via WebSocket
  // Using the same protocol as @wavemaker/wavepulse-agent
  function invoke(channelId, target, args = [], timeout = 10000) {
    return new Promise((resolve, reject) => {
      // Match the event name format used by wavepulse-agent
      const eventName = `call.${target}.${Date.now()}`;
      
      const timeoutId = setTimeout(() => {
        pendingInvokes.delete(eventName);
        reject(new Error(`No response in ${timeout} ms for ${target}`));
      }, timeout);

      pendingInvokes.set(eventName, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          pendingInvokes.delete(eventName);
          resolve(data);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          pendingInvokes.delete(eventName);
          reject(error);
        }
      });

      // Send invoke message using the same format as wavepulse-agent
      io.to(channelId).emit('message', {
        type: 'call',
        name: eventName,
        data: [{
          target: target,
          args: args
        }],
        channelId: channelId
      });
    });
  }

  // Make session store and invoke function accessible to API routes
  global.wavepulseSessionStore = {
    getSessionData,
    clearNetworkLogs: (channelId) => {
      const data = getSessionData(channelId);
      data.networkLogs = [];
    },
    clearConsoleLogs: (channelId) => {
      const data = getSessionData(channelId);
      data.consoleLogs = [];
    },
    clearTimelineLogs: (channelId) => {
      const data = getSessionData(channelId);
      data.timelineLogs = [];
    }
  };

  // Expose invoke function for API routes
  global.wavepulseInvoke = invoke;

  io.on("connection", (socket) => {
    let currentChannelId = null;

    socket.on('join', function (data) {
      currentChannelId = data.channelId;
      socket.join(data.channelId);
    });

    socket.on('message', (message) => {
      // Relay message to all clients in the channel
      io.to(message.channelId).emit('message', message);
      
      const channelId = message.channelId;
      
      // Handle invoke responses (type: 'event' with name starting with 'call.')
      if (message.type === 'event' && message.name && message.name.startsWith('call.')) {
        const pending = pendingInvokes.get(message.name);
        if (pending) {
          pending.resolve(message.data);
          return;
        }
      }
      
      // Capture event-based logs for REST API access
      if (channelId && message.name) {
        // Console logs
        if (message.name === 'console-log' && message.data) {
          addConsoleLog(channelId, message.data[0] || message.data);
        }
        // Network logs (service calls)
        if (message.name === 'service_after_call' && message.data) {
          const data = message.data;
          const req = data[0];
          const res = data[1];
          if (req && res) {
            const networkLog = {
              id: Date.now() + '',
              name: req.url?.split('?')[0].split('/').pop(),
              path: req.url,
              method: req.method,
              status: res.status,
              time: ((req.__endTime || 0) - (req.__startTime || 0)),
              req: req,
              res: res,
              timestamp: Date.now()
            };
            addNetworkLog(channelId, networkLog);
          }
        }
        // Timeline events
        if (message.name === 'timeline-event' && message.data) {
          addTimelineLog(channelId, message.data[0] || message.data);
        }
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
