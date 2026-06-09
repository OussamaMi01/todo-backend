// backend/index.js - Render.com version
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
console.log('Environment check:');
console.log('  PORT:', process.env.PORT);
console.log('  MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('  NODE_ENV:', process.env.NODE_ENV);

if (!process.env.MONGODB_URI) {
  console.error('❌ CRITICAL: MONGODB_URI environment variable is missing!');
  console.error('   Create a .env file with: MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

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
  introspection: true,
});

await server.start();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://checki-todo.vercel.app',
  'https://checki-todo-git-main.vercel.app',
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.onrender\.com$/,  // Allow Render preview URLs
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
  expressMiddleware(server)
);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at ${process.env.NODE_ENV === 'production' ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app.onrender.com'}` : `http://localhost:${PORT}`}/graphql`);