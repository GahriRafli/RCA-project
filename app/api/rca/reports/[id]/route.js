import { getRedis } from '@/lib/redis';

const LIST_KEY = 'rca:reports:list';
const reportKey = (id) => `rca:report:${id}`;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const redis = getRedis();
    const data = await redis.get(reportKey(id));

    if (!data) {
      return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    const report = typeof data === 'string' ? JSON.parse(data) : data;
    return Response.json(report);
  } catch (err) {
    console.error('RCA Report GET Error:', err);
    return Response.json({ error: 'Gagal mengambil laporan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const redis = getRedis();
    const existing = await redis.get(reportKey(id));

    if (!existing) {
      return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    const current = typeof existing === 'string' ? JSON.parse(existing) : existing;
    const updates = await request.json();

    const updated = {
      ...current,
      ...updates,
      id, // Ensure ID is not overwritten
      updated_at: new Date().toISOString(),
    };

    await redis.set(reportKey(id), JSON.stringify(updated));
    return Response.json(updated);
  } catch (err) {
    console.error('RCA Report PUT Error:', err);
    return Response.json({ error: 'Gagal memperbarui laporan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const redis = getRedis();

    const pipeline = redis.pipeline();
    pipeline.del(reportKey(id));
    pipeline.zrem(LIST_KEY, id);
    await pipeline.exec();

    return Response.json({ success: true });
  } catch (err) {
    console.error('RCA Report DELETE Error:', err);
    return Response.json({ error: 'Gagal menghapus laporan' }, { status: 500 });
  }
}
