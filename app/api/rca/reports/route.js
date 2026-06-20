import { getRedis } from '@/lib/redis';

const LIST_KEY = 'rca:reports:list';
const reportKey = (id) => `rca:report:${id}`;

export async function GET() {
  try {
    const redis = getRedis();

    // Get all report IDs from the sorted set (sorted by timestamp desc)
    const ids = await redis.zrange(LIST_KEY, 0, -1, { rev: true });

    if (!ids || ids.length === 0) {
      return Response.json([]);
    }

    // Fetch all reports in parallel
    const pipeline = redis.pipeline();
    for (const id of ids) {
      pipeline.get(reportKey(id));
    }
    const results = await pipeline.exec();

    const reports = results
      .filter(r => r !== null)
      .map(r => (typeof r === 'string' ? JSON.parse(r) : r));

    return Response.json(reports);
  } catch (err) {
    console.error('RCA Reports GET Error:', err);
    return Response.json(
      { error: 'Gagal mengambil daftar laporan' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const redis = getRedis();
    const body = await request.json();

    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const report = {
      id,
      judul: body.judul || 'Laporan Tanpa Judul',
      ringkasan: body.ringkasan || '',
      root_cause: body.root_cause || '',
      penyebab: body.penyebab || [],
      tindakan: body.tindakan || [],
      transcript: body.transcript || '',
      language: body.language || 'id',
      created_at: body.created_at || now,
      updated_at: now,
    };

    // Store the report and add to the sorted set index
    const pipeline = redis.pipeline();
    pipeline.set(reportKey(id), JSON.stringify(report));
    pipeline.zadd(LIST_KEY, {
      score: new Date(report.created_at).getTime(),
      member: id,
    });
    await pipeline.exec();

    return Response.json(report, { status: 201 });
  } catch (err) {
    console.error('RCA Reports POST Error:', err);
    return Response.json(
      { error: 'Gagal menyimpan laporan' },
      { status: 500 }
    );
  }
}
