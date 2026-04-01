// backend/src/index.js
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const prisma = new PrismaClient();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError) => {
    console.error('GraphQL Error:', formattedError);
    return formattedError;
  },
});

await server.start();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://checki-todo.vercel.app',
  'https://checki-todo-git-main.vercel.app',
  /^https:\/\/.*\.vercel\.app$/,
];

app.get('/', (_, res) => {
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.NODE_ENV === 'production'
    ? 'https://todo-backend-prod.up.railway.app'
    : `http://localhost:${PORT}`;
    
  res.json({
    name: 'Todo List API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    endpoints: {
      graphql: `${baseUrl}/graphql`,
      health: `${baseUrl}/health`
    }
  });
});

app.use(
  '/graphql',
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.log('CORS blocked:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
  bodyParser.json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({ prisma, token: req.headers.authorization }),
  })
);

// Health check endpoint
app.get('/health', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : process.env.NODE_ENV === 'production'
      ? 'https://todo-backend-prod.up.railway.app'
      : `http://localhost:${PORT}`;
      
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(), 
      database: 'connected',
      environment: process.env.NODE_ENV,
      url: `${baseUrl}/graphql`
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      error: 'Database connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 4000;

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

// Determine the correct URL to display
const getServerUrl = () => {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://todo-backend-prod.up.railway.app';
  }
  return `http://localhost:${PORT}`;
};

console.log(`🚀 Server ready at ${getServerUrl()}/graphql`);
console.log(`📊 Health check: ${getServerUrl()}/health`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);