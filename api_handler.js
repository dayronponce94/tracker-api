const fs = require('fs');
require('dotenv').config();
const { ApolloServer } = require('apollo-server-express');
const auth = require('./auth.js');

const GraphQLDate = require('./graphql_date.js');
const about = require('./about.js');
const issue = require('./issue.js');

const resolvers = {
  Query: {
    about: about.getMessage,
    issueList: issue.list,
    issue: issue.get,
    issueCounts: issue.counts,
  },
  Mutation: {
    setAboutMessage: about.setMessage,
    issueAdd: issue.add,
    issueUpdate: issue.update,
    issueDelete: issue.delete,
    issueRestore: issue.restore,
  },
  GraphQLDate,
};


function getContext({ req }) {
  console.log('JWT cookie received:', req.cookies?.jwt);
  const user = auth.getUser(req);
  console.log('User in context:', user);
  return { user };
}


const server = new ApolloServer({
  typeDefs: fs.readFileSync('schema.graphql', 'utf-8'),
  resolvers,
  context: getContext,
  formatError: (error) => {
    console.log(error);
    return error;
  },
  playground: true,
  introspection: true,
});

async function installHandler(app) {
  await server.start(); 

  const enableCors = (process.env.ENABLE_CORS || 'true') === 'true';
  console.log('CORS setting:', enableCors);

  server.applyMiddleware({
    app,
    path: '/graphql',
    cors: false, 
  });
}

module.exports = { installHandler };
