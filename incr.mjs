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

  fastify.route({
    method: 'POST',
    url: '/incr',
    response: {
      200: { type: 'object', properties: { message: { type: 'string' } } },
      401: { type: 'object', properties: { message: { type: 'string' } } }
    },
    handler: async (request, reply) => {
      if (request.cookies.compteur) {
        return { message: 'KO' }
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

      await Promise.all([streamPromise, redisPromise])

      reply.setCookie('compteur', 't', {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: 'strict',
        priority: 'high'
      })

      return { message: 'OK' }
    }
  })
}

export default routes
