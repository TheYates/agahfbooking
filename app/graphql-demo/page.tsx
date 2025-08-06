import { GraphQLDemo } from '@/components/graphql-demo';

export default function GraphQLDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <GraphQLDemo />
    </div>
  );
}

export const metadata = {
  title: 'GraphQL Demo - Booking App',
  description: 'Demonstration of GraphQL implementation in the booking app',
};
