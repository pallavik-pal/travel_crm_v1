import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

const contentDisposition = (fileName: string, download: boolean) => {
  const fallbackName = fileName.replace(/["\\]/g, '');
  const encodedName = encodeURIComponent(fileName);
  const disposition = download ? 'attachment' : 'inline';

  return `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      fileName: true,
      mimeType: true,
      fileData: true,
    },
  });

  if (!document?.fileData) {
    return NextResponse.json({ error: 'Document file was not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get('download') === '1';
  const bytes = new Uint8Array(document.fileData);

  return new Response(bytes, {
    headers: {
      'Content-Type': document.mimeType || 'application/octet-stream',
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': contentDisposition(document.fileName, download),
      'Cache-Control': 'private, max-age=300',
    },
  });
}
