import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { password } = await request.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  if (password === sitePassword) {
    const cookieStore = await cookies();
    cookieStore.set('otf-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('otf-auth');

  return NextResponse.json({
    authenticated: authCookie?.value === 'authenticated',
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('otf-auth');
  return NextResponse.json({ success: true });
}
