const redis = require("redis")
const Constants = require('../Constants')


const client = redis.createClient({
    'host': Constants.REDIS_URL,
    'port': 6379,
    'db': 0
})

module.exports = {
    redis_client: client
}