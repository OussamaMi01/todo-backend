// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Clear existing data
  await prisma.todo.deleteMany({});
  console.log('✅ Cleared existing todos');
  
  const todos = [
    {
      title: 'Set up GraphQL API with Prisma',
      description: 'Initialize Apollo Server with Express and PostgreSQL',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueDate: null,
    },
    {
      title: 'Build Next.js frontend',
      description: 'Create a beautiful UI with Apollo Client and TailwindCSS',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
    {
      title: 'Write comprehensive tests',
      description: 'Cover all GraphQL queries and mutations',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000 * 7),
    },
    {
      title: 'Deploy to production',
      description: 'Use Vercel for frontend, Railway/Supabase for backend',
      priority: 'LOW',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000 * 14),
    },
  ];

  for (const todo of todos) {
    await prisma.todo.create({ data: todo });
    console.log(`✅ Created todo: ${todo.title}`);
  }
  
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });