module.exports = {
    apps: [
        {
            name: 'dap-backend',
            cwd: '/data/dap/app/backend',
            script: 'dist/server.js',
            instances: 4,  // Reduced from 'max' (16) to prevent DB connection exhaustion
            exec_mode: 'cluster',
            env_file: '/data/dap/app/.env',
            env: {
                NODE_ENV: 'production',
                PORT: 4000
            },
            error_file: '/data/dap/logs/backend-error.log',
            out_file: '/data/dap/logs/backend-out.log',
            log_file: '/data/dap/logs/backend.log',
            time: true,
            max_memory_restart: '1G',
            autorestart: true,
            max_restarts: 10,
            restart_delay: 1000
        },
        {
            name: 'dap-frontend',
            script: 'serve',
            env: {
                PM2_SERVE_PATH: '/data/dap/app/frontend/dist',
                PM2_SERVE_PORT: 3000,
                PM2_SERVE_SPA: 'true',
                PM2_SERVE_HOMEPAGE: '/index.html'
            },
            error_file: '/data/dap/logs/frontend-error.log',
            out_file: '/data/dap/logs/frontend-out.log',
            log_file: '/data/dap/logs/frontend.log'
        }
    ]
};
