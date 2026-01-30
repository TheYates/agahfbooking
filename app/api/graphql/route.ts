import { ApolloServer } from "@apollo/server";
import type {
  GraphQLRequestContext,
  GraphQLRequestListener,
  BaseContext,
} from "@apollo/server";
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
    {
      async requestDidStart(
        _requestContext: GraphQLRequestContext<BaseContext>
      ): Promise<void | GraphQLRequestListener<BaseContext>> {
        return {
          async willSendResponse(requestContext) {
            const { request, response } = requestContext;
            console.log(`GraphQL ${request.operationName}`);
          },
        };
      },
    },
  ],
});

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    return {
      user: null,
      req,
    };
  },
});

// Next.js expects GET/POST handlers with a single request argument.
export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
