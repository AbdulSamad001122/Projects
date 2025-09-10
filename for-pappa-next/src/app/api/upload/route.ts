import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    original_filename: string;
    format: string;
    resource_type: string;
    bytes: number;
    [key: string]: any;
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 400 });
        }

        // Allow PDFs and Excel files (XLSX, XLS, CSV)
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Only PDF or Excel files (XLSX/XLS/CSV) are allowed. Received: ${file.type || 'unknown'}` },
                { status: 400 }
            );
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size exceeds 10MB limit" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Use Cloudinary 'raw' resource type for non-images like PDF/Excel
        const resourceType = 'raw';

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "processed-pdfs",
                        resource_type: resourceType,
                        public_id: `${userId}_${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
                        use_filename: true,
                        unique_filename: false,
                        overwrite: true,
                        access_mode: 'public',
                        type: 'upload'
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                        } else {
                            resolve(result as CloudinaryUploadResult);
                        }
                    }
                );
                uploadStream.end(buffer);
            }
        );

        return NextResponse.json(
            {
                success: true,
                publicId: result.public_id,
                secureUrl: result.secure_url,
                originalFilename: result.original_filename,
                format: result.format,
                resourceType: result.resource_type,
                bytes: result.bytes
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Upload failed:", error);
        return NextResponse.json(
            { error: "Upload failed. Please try again." },
            { status: 500 }
        );
    }
}