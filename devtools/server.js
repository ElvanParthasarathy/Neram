const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PORT = 3000;

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neram DevTools - Notification Tester</title>
    <style>
        :root {
            --mac-bg: #F2F2F7;
            --mac-card: #FFFFFF;
            --mac-text: #000000;
            --mac-text-sec: #8E8E93;
            --mac-blue: #007AFF;
            --mac-border: #E5E5EA;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --mac-bg: #000000;
                --mac-card: #1C1C1E;
                --mac-text: #FFFFFF;
                --mac-border: #38383A;
            }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--mac-bg);
            color: var(--mac-text);
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }
        
        .card {
            background: var(--mac-card);
            border-radius: 16px;
            padding: 24px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.05);
            border: 1px solid var(--mac-border);
        }
        
        h1 {
            margin: 0 0 8px 0;
            font-size: 22px;
            font-weight: 600;
        }
        
        p {
            margin: 0 0 24px 0;
            color: var(--mac-text-sec);
            font-size: 14px;
            line-height: 1.5;
        }
        
        label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--mac-text-sec);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        input[type="date"] {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--mac-border);
            border-radius: 12px;
            background: var(--mac-bg);
            color: var(--mac-text);
            font-size: 16px;
            font-family: inherit;
            margin-bottom: 24px;
            box-sizing: border-box;
            outline: none;
        }
        
        input[type="date"]:focus {
            border-color: var(--mac-blue);
        }
        
        button {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 12px;
            background: var(--mac-blue);
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        
        button:hover {
            opacity: 0.9;
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        #log {
            margin-top: 24px;
            padding: 16px;
            background: var(--mac-bg);
            border-radius: 12px;
            font-family: monospace;
            font-size: 12px;
            color: var(--mac-text-sec);
            white-space: pre-wrap;
            display: none;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--mac-border);
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Notification Tester</h1>
        <p>Trigger the Android daily alarm manually to test the kill switch and schedule parsing.</p>
        
        <label>Override Date (Optional)</label>
        <input type="date" id="dateInput" />
        
        <button id="triggerBtn" onclick="triggerNotification()">Send ADB Broadcast</button>
        
        <div id="log"></div>
    </div>

    <script>
        // Set default to today
        document.getElementById('dateInput').valueAsDate = new Date();
        
        async function triggerNotification() {
            const btn = document.getElementById('triggerBtn');
            const logEl = document.getElementById('log');
            const dateStr = document.getElementById('dateInput').value;
            
            btn.disabled = true;
            btn.textContent = 'Sending...';
            logEl.style.display = 'block';
            logEl.textContent = 'Executing ADB command...\\n';
            
            try {
                const url = '/api/trigger?date=' + encodeURIComponent(dateStr);
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.success) {
                    logEl.textContent += '\\n✅ SUCCESS:\\n' + data.output;
                    btn.style.background = '#34C759';
                    btn.textContent = 'Sent Successfully';
                } else {
                    logEl.textContent += '\\n❌ ERROR:\\n' + data.error;
                    btn.style.background = '#FF3B30';
                    btn.textContent = 'Failed';
                }
            } catch (err) {
                logEl.textContent += '\\n❌ NETWORK ERROR:\\n' + err.message;
                btn.style.background = '#FF3B30';
                btn.textContent = 'Failed';
            }
            
            setTimeout(() => {
                btn.disabled = false;
                btn.style.background = 'var(--mac-blue)';
                btn.textContent = 'Send ADB Broadcast';
            }, 3000);
        }
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    // Basic router
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlContent);
    } else if (req.url.startsWith('/api/trigger')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const dateStr = urlParams.searchParams.get('date');
        
        // Build the ADB command
        // The Android receiver is listening for com.elvan.neram.DAILY_ALARM
        // and extracts "date_override"
        let cmd = 'adb shell am broadcast -a com.elvan.neram.DAILY_ALARM -n com.elvan.neram/com.elvan.rmdneram.receivers.DailyAlarmReceiver';
        if (dateStr) {
            cmd += ` --es date_override "${dateStr}"`;
        }
        
        exec(cmd, (error, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (error) {
                res.end(JSON.stringify({ success: false, error: error.message || stderr }));
            } else {
                res.end(JSON.stringify({ success: true, output: stdout }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 Neram DevTools running on port ${PORT}`);
    console.log(`===========================================`);
    console.log(`-> Open http://localhost:${PORT} in your browser`);
    console.log(`-> Ensure your Android device/emulator is connected via ADB`);
    console.log(`===========================================`);
});
