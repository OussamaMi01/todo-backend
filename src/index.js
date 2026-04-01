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

app.use(
  '/graphql',
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
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
console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);