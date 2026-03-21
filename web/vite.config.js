import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import https from 'https'
import http from 'http'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'proxy-server',
      configureServer(server) {
        const fetchTarget = (target, depth = 0) => {
          if (depth > 5) return Promise.reject(new Error("Too many redirects"));
          return new Promise((resolve, reject) => {
            const protocol = target.startsWith('https') ? https : http;
            protocol.get(target, { rejectUnauthorized: false }, (res) => {
              if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let nextUrl = res.headers.location;
                if (!nextUrl.startsWith('http')) {
                  const origin = new URL(target).origin;
                  nextUrl = new URL(nextUrl, origin).href;
                }
                fetchTarget(nextUrl, depth + 1).then(resolve).catch(reject);
              } else {
                resolve(res);
              }
            }).on('error', reject);
          });
        };

        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api/proxy')) {
            const urlObj = new URL(req.url, 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');
            if (targetUrl) {
              fetchTarget(targetUrl).then((proxyRes) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                proxyRes.pipe(res);
              }).catch((e) => {
                res.statusCode = 500;
                res.end(e.message);
              });
              return;
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
})
