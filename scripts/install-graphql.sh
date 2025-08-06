#!/bin/bash

# Install GraphQL dependencies for the booking app

echo "Installing GraphQL dependencies..."

# Core GraphQL packages
npm install @apollo/server @apollo/client graphql graphql-tag

# Apollo Server integrations
npm install @apollo/server-integration-next

# Apollo Client utilities
npm install @apollo/client-link-error @apollo/client-link-context

# Development dependencies
npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo

echo "GraphQL dependencies installed successfully!"

echo "Next steps:"
echo "1. Start your development server: npm run dev"
echo "2. Visit http://localhost:3000/api/graphql to access GraphQL Playground"
echo "3. Use the provided hooks in your React components"
echo "4. Check docs/graphql-implementation.md for usage examples"
