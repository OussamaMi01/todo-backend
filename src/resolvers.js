// backend/src/resolvers.js
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('❌ MONGODB_URI is not defined in environment variables. Please check your .env file.');
}

let client;
let db;
let todosCollection;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(process.env.DB_NAME || 'todo_app');
    todosCollection = db.collection('todos');
    console.log('✅ Connected to MongoDB Atlas');
  }
  return { db, todosCollection };
}

const statusCycle = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'PENDING',
};

const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const resolvers = {
  Query: {
    todos: async (_, { priority, status }) => {
      await connectDB();
      try {
        const filter = {};
        if (priority) filter.priority = priority;
        if (status) filter.status = status;
        
        const todos = await todosCollection.find(filter).toArray();
        
        return todos
          .map(todo => ({
            id: todo._id.toString(),
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            status: todo.status,
            createdAt: todo.createdAt,
            updatedAt: todo.updatedAt,
            dueDate: todo.dueDate,
          }))
          .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      } catch (error) {
        console.error('Error fetching todos:', error);
        throw new Error('Failed to fetch todos');
      }
    },
    
    todo: async (_, { id }) => {
      await connectDB();
      try {
        const todo = await todosCollection.findOne({ _id: new ObjectId(id) });
        if (!todo) throw new Error(`Todo with id ${id} not found`);
        
        return {
          id: todo._id.toString(),
          title: todo.title,
          description: todo.description,
          priority: todo.priority,
          status: todo.status,
          createdAt: todo.createdAt,
          updatedAt: todo.updatedAt,
          dueDate: todo.dueDate,
        };
      } catch (error) {
        console.error('Error fetching todo:', error);
        throw new Error('Failed to fetch todo');
      }
    },
  },

  Mutation: {
    createTodo: async (_, { input }) => {
      await connectDB();
      try {
        const now = new Date().toISOString();
        const todo = {
          title: input.title,
          description: input.description || null,
          priority: input.priority,
          status: 'PENDING',
          dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
          createdAt: now,
          updatedAt: now,
        };
        
        const result = await todosCollection.insertOne(todo);
        
        return {
          id: result.insertedId.toString(),
          ...todo,
        };
      } catch (error) {
        console.error('Error creating todo:', error);
        throw new Error('Failed to create todo');
      }
    },

    updateTodo: async (_, { id, input }) => {
      await connectDB();
      try {
        const updateData = { updatedAt: new Date().toISOString() };
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate).toISOString() : null;
        
        await todosCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        
        const updatedTodo = await todosCollection.findOne({ _id: new ObjectId(id) });
        
        return {
          id: updatedTodo._id.toString(),
          title: updatedTodo.title,
          description: updatedTodo.description,
          priority: updatedTodo.priority,
          status: updatedTodo.status,
          createdAt: updatedTodo.createdAt,
          updatedAt: updatedTodo.updatedAt,
          dueDate: updatedTodo.dueDate,
        };
      } catch (error) {
        console.error('Error updating todo:', error);
        throw new Error('Failed to update todo');
      }
    },

    deleteTodo: async (_, { id }) => {
      await connectDB();
      try {
        const result = await todosCollection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
      } catch (error) {
        console.error('Error deleting todo:', error);
        throw new Error('Failed to delete todo');
      }
    },

    toggleStatus: async (_, { id }) => {
      await connectDB();
      try {
        const todo = await todosCollection.findOne({ _id: new ObjectId(id) });
        if (!todo) throw new Error(`Todo with id ${id} not found`);
        
        const newStatus = statusCycle[todo.status];
        
        await todosCollection.updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              status: newStatus,
              updatedAt: new Date().toISOString()
            } 
          }
        );
        
        const updatedTodo = await todosCollection.findOne({ _id: new ObjectId(id) });
        
        return {
          id: updatedTodo._id.toString(),
          title: updatedTodo.title,
          description: updatedTodo.description,
          priority: updatedTodo.priority,
          status: updatedTodo.status,
          createdAt: updatedTodo.createdAt,
          updatedAt: updatedTodo.updatedAt,
          dueDate: updatedTodo.dueDate,
        };
      } catch (error) {
        console.error('Error toggling status:', error);
        throw new Error('Failed to toggle status');
      }
    },
  },
};