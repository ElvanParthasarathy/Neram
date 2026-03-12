const http = require('http');
const { exec } = require('child_process');

const PORT = 3000;
const ADDR = '127.0.0.1';

const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Neram Notification Tester</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
        .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { margin-top: 0; color: #333; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: bold; }
        input[type="date"] { padding: 10px; font-size: 16px; width: 220px; border: 1px solid #ccc; border-radius: 6px; }
        button { background: #0066cc; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        button:hover { background: #0052a3; }
        #status { margin-top: 20px; padding: 15px; border-radius: 6px; display: none; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .presets { display: flex; gap: 10px; margin-bottom: 20px; }
        .preset-btn { background: #e0e0e0; color: #333; padding: 8px 16px; font-size: 14px; border: none; border-radius: 4px; cursor: pointer; }
        .preset-btn:hover { background: #ccc; }
    </style>
</head>
<body>
    <div class="card">
        <h1>📱 Neram Tester</h1>
        <p>Trigger local ADB broadcasts to test daily notifications.</p>
        
        <div class="presets">
            <button class="preset-btn" onclick="setDate('2026-03-10')">Set March 10 (SIA Exam)</button>
            <button class="preset-btn" onclick="setToday()">Set Today</button>
        </div>

        <div class="form-group">
            <label>Target Date Override:</label>
            <input type="date" id="dateInput">
        </div>
        
        <button onclick="sendNotification()">🚀 Send Notification Broadcast</button>

        <div id="status"></div>
    </div>

    <script>
        function setDate(dateStr) { document.getElementById('dateInput').value = dateStr; }

        function setToday() {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            document.getElementById('dateInput').value = yyyy + '-' + mm + '-' + dd;
        }
        
        setToday();

        async function sendNotification() {
            const date = document.getElementById('dateInput').value;
            const statusDiv = document.getElementById('status');
            
            if (!date) return;

            statusDiv.style.display = 'block';
            statusDiv.className = '';
            statusDiv.textContent = 'Sending ADB broadcast...';

            try {
                const response = await fetch('/trigger?date=' + date);
                const result = await response.json();
                
                if (result.success) {
                    showStatus('✅ Broadcast sent successfully to phone!', true);
                } else {
                    showStatus('❌ Failed: ' + result.error, false);
                }
            } catch (e) {
                showStatus('❌ Connection error.', false);
            }
        }

        function showStatus(msg, isSuccess) {
            const statusDiv = document.getElementById('status');
            statusDiv.style.display = 'block';
            statusDiv.className = isSuccess ? 'success' : 'error';
            statusDiv.textContent = msg;
        }
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    } else if (req.url.startsWith('/trigger')) {
        const urlParams = new URL(req.url, 'http://localhost:3000');
        const date = urlParams.searchParams.get('date');

        if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid date format' }));
            return;
        }

        const cmd = `adb shell am broadcast -a com.elvan.neram.DAILY_ALARM -n com.elvan.neram/com.elvan.rmdneram.receivers.DailyAlarmReceiver --es date_override "${date}"`;

        exec(cmd, (error, stdout) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (error) {
                res.end(JSON.stringify({ success: false, error: error.message }));
            } else {
                res.end(JSON.stringify({ success: true, output: stdout }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, ADDR, () => {
    console.log(`✅ Tester running at http://${ADDR}:${PORT}`);
    console.log(`Make sure your phone is connected and ADB is authorized!`);
});
