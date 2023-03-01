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
      reply.header('Cache-Control', 'public, max-age=2')
      return { value: parseInt(value, 10) }
    }
  })
}

export default routes
