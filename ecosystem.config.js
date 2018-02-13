module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [

        // First application
        {
            name: 'Affilinetwork',
            script: './bin/www',
            instances: 0,
            exec_mode: "cluster",
            env: {
                COMMON_VARIABLE: 'true'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ],

    /**
     * Deployment section
     * http://pm2.keymetrics.io/docs/usage/deployment/
     */
    deploy: {
        production: {
            user: 'ubuntu',
            host: 'allhaha.com',
            ref: 'origin/master',
            repo: 'git@github.com:abysmli/Affilinetwork.git',
            path: '/home/ubuntu/workspace',
            'post-deploy': 'npm install && sudo PORT=80 pm2 reload ecosystem.config.js --env production'
        },
        dev: {
            user: 'abysmli',
            host: 'localhost',
            ref: 'origin/master',
            repo: 'git@github.com:abysmli/Affilinetwork.git',
            path: '/mnt/d/workspace/Affilinetwork',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env dev',
            env: {
                NODE_ENV: 'dev'
            }
        }
    }
};
