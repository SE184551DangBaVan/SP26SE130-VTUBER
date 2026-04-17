module.exports = {
    apps: [{
        name: 'Fanhub_Vtuber',
        script: 'npm',
        args: 'start',
        env_production: {
            PORT: 80,
            NODE_ENV: 'production'
        }
    }]
}