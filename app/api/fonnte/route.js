import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { target, message, token } = body;

    if (!target || !message || !token) {
      return NextResponse.json({ error: 'Missing required parameters (target, message, token)' }, { status: 400 });
    }

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: target,
        message: message,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return NextResponse.json({ error: data.reason || 'Failed to send WhatsApp message via Fonnte' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Fonnte API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
