import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const filename = searchParams.get('filename');

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    console.log(`Attempting to download PDF with publicId: ${publicId}`);

    // Only allow PDFs from the processed-pdfs folder
    const allowedFolderPrefix = 'processed-pdfs/';
    if (!publicId.startsWith(allowedFolderPrefix)) {
      return NextResponse.json({ error: 'Access denied: PDF must be in processed-pdfs folder' }, { status: 403 });
    }
    
    // Generate a signed, time-limited download URL for raw PDFs
    const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'raw',
      type: 'upload',
      expires_at: expiresAt,
    });

    if (!signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    // Fetch the signed URL and stream bytes back without redirect
    const response = await fetch(signedUrl);
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch PDF: ${response.status}` }, { status: response.status });
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'download.pdf'}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Download PDF API error:', error);
    return NextResponse.json(
      { error: `Failed to download PDF: ${error.message}` },
      { status: 500 }
    );
  }
}
