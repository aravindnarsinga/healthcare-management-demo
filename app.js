
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WEB_DIR = path.join(__dirname, 'public');

// In-memory demonstration data only.
// Data resets when the application restarts.
const patients = [];
const appointments = [];

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10000) {
        reject(new Error('Request too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(
    req.url, 'http://localhost'
  ).pathname;

  if (req.method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, {
      status: 'UP',
      application: 'healthcare-management-demo'
    });
  }

  if (req.method === 'GET' && pathname === '/api/dashboard') {
    return sendJson(res, 200, {
      patients: patients.length,
      appointments: appointments.length,
      doctors: 4,
      status: 'Demo environment'
    });
  }

  if (req.method === 'POST' && pathname === '/api/patients') {
    try {
      const data = await readBody(req);

      if (!data.name || !data.email) {
        return sendJson(res, 400, {
          error: 'Name and email are required'
        });
      }

      const patient = {
        id: `DEMO-${patients.length + 1}`,
        name: String(data.name).slice(0, 80),
        email: String(data.email).slice(0, 120)
      };

      patients.push(patient);

      return sendJson(res, 201, {
        message: 'Demo patient registered',
        patient
      });
    } catch (error) {
      return sendJson(res, 400, {
        error: error.message
      });
    }
  }

  if (req.method === 'POST' && pathname === '/api/appointments') {
    try {
      const data = await readBody(req);

      if (!data.name || !data.doctor || !data.date) {
        return sendJson(res, 400, {
          error: 'Name, doctor and date are required'
        });
      }

      const appointment = {
        id: `APPT-${appointments.length + 1}`,
        name: String(data.name).slice(0, 80),
        doctor: String(data.doctor).slice(0, 80),
        date: String(data.date).slice(0, 20)
      };

      appointments.push(appointment);

      return sendJson(res, 201, {
        message: 'Demo appointment requested',
        appointment
      });
    } catch (error) {
      return sendJson(res, 400, {
        error: error.message
      });
    }
  }

  if (req.method === 'GET' && pathname.startsWith('/api/')) {
    return sendJson(res, 404, { error: 'API endpoint not found' });
  }

  const requested = pathname === '/'
    ? 'index.html'
    : pathname.slice(1);

  const safeFile = path.resolve(WEB_DIR, requested);

  if (!safeFile.startsWith(WEB_DIR + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(safeFile, (error, content) => {
    if (error) {
      res.writeHead(404);
      return res.end('Not found');
    }

    const ext = path.extname(safeFile);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.svg': 'image/svg+xml'
    };

    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Healthcare demo running on port ${PORT}`);
});
