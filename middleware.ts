import { NextResponse, type NextRequest } from 'next/server'

// Auth temporarily disabled — dashboard is open for development
export async function middleware(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
