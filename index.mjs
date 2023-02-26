#!/usr/bin/env node

import Redis from 'ioredis'

import fastifyBuilder from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'

import incrRoute from './incr.mjs'
import valRoute from './val.mjs'

const logConfig = {
  level: 'info'
}

const fastify = fastifyBuilder({ logger: logConfig })
fastify.register(cookie, {})
fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST'],
  credentials: true
})

const start = async () => {
  const redisKey = process.env.REDIS_KEY || 'compteur'
  const redis = new Redis()
  fastify.register(incrRoute, {
    redis,
    redisKey,
    recordPath: process.env.LOG_PATH || '/tmp/'
  })
  fastify.register(valRoute, {
    redis,
    redisKey
  })
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
