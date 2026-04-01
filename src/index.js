// backend/index.js
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

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

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
  'https://checki-todo.vercel.app', // No trailing slash
  'https://checki-todo-git-main.vercel.app', // Preview deployments
  'https://checki-todo.vercel.app', // Production
  // Allow any .vercel.app domain for preview deployments
  /^https:\/\/.*\.vercel\.app$/,
  // Allow Railway domain if needed
  'https://todo-backend-prod.up.railway.app',
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
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin matches any allowed pattern
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
  expressMiddleware(server)
);

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at ${process.env.NODE_ENV === 'production' ? 'https://todo-backend-prod.up.railway.app' : `http://localhost:${PORT}`}/graphql`);