const config = {
    server: {
        host: "0.0.0.0",

        ports: {
            http: 80,
            https: 443
        },

        ssl: {
            enabled: true,

            certificate: __dirname + "/static/ssl/certificate.crt",
            chain: __dirname + "/static/ssl/chain.crt",
            privateKey: __dirname + "/static/ssl/private.key"
        }
    },

    database: {
        host: "localhost",
        port: 3306,
        username: "root",
        password: "",
        name: "wirone-template"
    }
}

module.exports = config;