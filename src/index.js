// backend/src/index.js
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { typeDefs } from './schema.js';  // Now relative to src folder
import { resolvers } from './resolvers.js';  // Now relative to src folder
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

// Updated CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://checki-todo.vercel.app',
  'https://checki-todo-git-main.vercel.app',
  /^https:\/\/.*\.vercel\.app$/,
];

app.get('/', (_, res) => {
  res.json({
    name: 'Todo List API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      graphql: '/graphql',
      health: '/health'
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
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 4000;

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at ${process.env.NODE_ENV === 'production' ? 'https://todo-backend-prod.up.railway.app' : `http://localhost:${PORT}`}/graphql`);