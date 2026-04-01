import { gql } from 'graphql-tag';

export const typeDefs = gql`
  enum Priority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum Status {
    PENDING
    IN_PROGRESS
    COMPLETED
  }

  type Todo {
    id: ID!
    title: String!
    description: String
    priority: Priority!
    status: Status!
    createdAt: String!
    updatedAt: String!
    dueDate: String
  }

  type Query {
    todos(priority: Priority, status: Status): [Todo!]!
    todo(id: ID!): Todo
  }

  type Mutation {
    createTodo(input: CreateTodoInput!): Todo!
    updateTodo(id: ID!, input: UpdateTodoInput!): Todo!
    deleteTodo(id: ID!): Boolean!
    toggleStatus(id: ID!): Todo!
  }

  input CreateTodoInput {
    title: String!
    description: String
    priority: Priority!
    dueDate: String
  }

  input UpdateTodoInput {
    title: String
    description: String
    priority: Priority
    status: Status
    dueDate: String
  }
`;
