#!/usr/bin/env node

import Redis from 'ioredis'

import fastifyBuilder from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'

import incrRoute from './incr.mjs'
import valRoute from './val.mjs'

const PORT = +process.env.PORT || 3000
const REDIS_KEY = process.env.REDIS_KEY || 'compteur'
const RECORD_PATH = process.env.RECORD_PATH || '/tmp'
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN

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
  const redis = new Redis()
  fastify.register(incrRoute, {
    redis,
    redisKey: REDIS_KEY,
    recordPath: RECORD_PATH,
    cookieDomain: COOKIE_DOMAIN
  })
  fastify.register(valRoute, {
    redis,
    redisKey: REDIS_KEY
  })
  try {
    await fastify.listen({ port: PORT })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
