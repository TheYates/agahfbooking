import { auth } from "@/lib/auth";

// `auth.handler` is a single request handler function. Next.js Route Handlers
// expect named exports `GET` and/or `POST`.

export async function GET(request: Request) {
  return auth.handler(request);
}

export async function POST(request: Request) {
  return auth.handler(request);
}
