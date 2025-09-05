import { NextRequest, NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Validate that it's a Cloudinary URL for security
    if (!imageUrl.includes('cloudinary.com')) {
      return NextResponse.json(
        { error: 'Only Cloudinary URLs are allowed' },
        { status: 400 }
      );
    }

    console.log('🔄 Proxying image request for:', imageUrl);

    // Fetch the image from Cloudinary
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Invoice-Generator-Proxy/1.0'
      }
    });

    if (!response.ok) {
      console.log('❌ Failed to fetch image:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Image fetched successfully, size:', imageBuffer.byteLength, 'bytes');

    // Convert to base64
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUrl,
      contentType,
      size: imageBuffer.byteLength
    });

  } catch (error) {
    console.error('❌ Error in image proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}