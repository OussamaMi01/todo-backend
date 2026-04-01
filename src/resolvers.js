// backend/resolvers.js
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const statusCycle = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'PENDING',
};

export const resolvers = {
  Query: {
    todos: async (_, { priority, status }) => {
      try {
        const where = {};
        if (priority) where.priority = priority;
        if (status) where.status = status;
        
        const todos = await prisma.todo.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
        });
        
        // Custom priority sorting
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return todos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      } catch (error) {
        console.error('Error fetching todos:', error);
        throw new Error('Failed to fetch todos');
      }
    },
    
    todo: async (_, { id }) => {
      try {
        const todo = await prisma.todo.findUnique({
          where: { id },
        });
        if (!todo) throw new Error(`Todo with id ${id} not found`);
        return todo;
      } catch (error) {
        console.error('Error fetching todo:', error);
        throw new Error('Failed to fetch todo');
      }
    },
  },

  Mutation: {
    createTodo: async (_, { input }) => {
      try {
        const todo = await prisma.todo.create({
          data: {
            title: input.title,
            description: input.description || null,
            priority: input.priority,
            status: 'PENDING',
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
          },
        });
        return todo;
      } catch (error) {
        console.error('Error creating todo:', error);
        throw new Error('Failed to create todo');
      }
    },

    updateTodo: async (_, { id, input }) => {
      try {
        const updateData = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
        
        const todo = await prisma.todo.update({
          where: { id },
          data: updateData,
        });
        return todo;
      } catch (error) {
        console.error('Error updating todo:', error);
        throw new Error('Failed to update todo');
      }
    },

    deleteTodo: async (_, { id }) => {
      try {
        await prisma.todo.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error('Error deleting todo:', error);
        throw new Error('Failed to delete todo');
      }
    },

    toggleStatus: async (_, { id }) => {
      try {
        const todo = await prisma.todo.findUnique({
          where: { id },
        });
        
        if (!todo) throw new Error(`Todo with id ${id} not found`);
        
        const newStatus = statusCycle[todo.status];
        
        const updatedTodo = await prisma.todo.update({
          where: { id },
          data: { status: newStatus },
        });
        
        return updatedTodo;
      } catch (error) {
        console.error('Error toggling status:', error);
        throw new Error('Failed to toggle status');
      }
    },
  },
};