// backend/test.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing connection...');
    const todos = await prisma.todo.findMany();
    console.log('✅ Connected! Found', todos.length, 'todos');
    console.log('Todos:', todos);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();