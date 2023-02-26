async function routes (fastify, options) {
  const redis = options.redis
  const redisKey = options.redisKey || 'compteur'

  fastify.route({
    method: 'GET',
    url: '/val',
    response: {
      200: { type: 'object', properties: { value: { type: 'integer' } } }
    },
    handler: async (request, reply) => {
      const value = await redis.get(redisKey)
      return { value: +value }
    }
  })
}

export default routes
