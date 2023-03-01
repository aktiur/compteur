#!/usr/bin/env node

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

async function routes (fastify, options) {
  const redis = options.redis
  const redisKey = options.redisKey || 'compteur'
  const recordPath = options.recordPath
  const recordFile = path.join(recordPath, crypto.randomUUID())
  const recordStream = fs.createWriteStream(recordFile)
  const cookieDomain = options.cookieDomain

  fastify.route({
    method: 'POST',
    url: '/incr',
    response: {
      200: { type: 'object', properties: { message: { type: 'string' } } }
    },
    handler: async (request, reply) => {
      if (request.cookies.compteur) {
        const value = await redis.get(redisKey)
        return { message: 'OK', value: parseInt(value, 10) }
      }

      // log infos to file
      const infos = JSON.stringify({
        id: request.id,
        ip: request.ip,
        headers: request.headers
      })

      let streamPromise
      if (recordStream.write(infos + '\n')) {
        streamPromise = Promise.resolve()
      } else {
        streamPromise = new Promise(resolve => recordStream.once('drain', resolve))
      }

      // increase redis counter
      const redisPromise = redis.incr(redisKey)

      const [value] = await Promise.all([redisPromise, streamPromise])

      reply.setCookie('compteur', 't', {
        domain: cookieDomain,
        maxAge: 60 * 60 * 24 * 365, // un an
        httpOnly: true,
        sameSite: 'none', // pour une utilisation cross-site
        priority: 'high',
        secure: true // nécessaire pour une utilisation cross-site
      })

      return { message: 'OK', value: parseInt(value, 10) }
    }
  })
}

export default routes
