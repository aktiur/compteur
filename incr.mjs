#!/usr/bin/env node

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const logRequest = (req) => {
  const {
    'user-agent': ua,
    'x-real-ip': ip,
    'x-forwarded-for': _forward,
    host: _host,
    origin: o,
    referer: r,
    ...hs
  } = req.headers
  const infos = {
    id: req.id,
    ip,
    ua,
    o,
    r,
    hs
  }
  return JSON.stringify(infos)
}

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
      const infos = logRequest(request)

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
