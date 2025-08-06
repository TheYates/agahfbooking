import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import typeDefs from "@/lib/graphql/schema";
import resolvers from "@/lib/graphql/resolvers";

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV === "development",
  plugins: [
    // Add performance monitoring
    {
      requestDidStart() {
        return {
          willSendResponse(requestContext) {
            const { request, response } = requestContext;
            console.log(
              `GraphQL ${request.operationName}: ${response.http?.statusCode}`
            );
          },
        };
      },
    },
  ],
});

// Create the handler
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    // For now, return basic context without auth
    // TODO: Add authentication later
    return {
      user: null,
      req,
    };
  },
});

export { handler as GET, handler as POST };
