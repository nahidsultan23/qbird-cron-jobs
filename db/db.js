const dbConfig = require('../config/db-config');

module.exports = {
    DB: 'mongodb+srv://' + dbConfig.user + ':' + dbConfig.password + '@' + dbConfig.host +'/' + dbConfig.db + '?retryWrites=true&w=majority'
}