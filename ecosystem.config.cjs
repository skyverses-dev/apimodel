module.exports = {
    apps: [
        {
            name: '2brain',
            script: '.next/standalone/server.js',
            cwd: __dirname,
            env: {
                NODE_ENV: 'production',
                PORT: 3611,
                HOSTNAME: '0.0.0.0',
            },
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '512M',
            watch: false,
            autorestart: true,

            // Logs
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Graceful restart
            kill_timeout: 5000,
            listen_timeout: 10000,
        },
    ],
}
