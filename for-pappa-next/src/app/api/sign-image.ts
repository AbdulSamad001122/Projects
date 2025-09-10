import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
    try {
        // Configure Cloudinary with error checking
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.error('Missing Cloudinary environment variables:', {
                cloudName: !!cloudName,
                apiKey: !!apiKey,
                apiSecret: !!apiSecret
            });
            return Response.json(
                { error: 'Cloudinary configuration is incomplete' },
                { status: 500 }
            );
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });

        const body = (await request.json()) as { paramsToSign: Record<string, string> };
        const { paramsToSign } = body;

        const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

        return Response.json({ signature });
    } catch (error) {
        console.error('Error in sign-image API:', error);
        return Response.json(
            { error: 'Failed to generate signature' },
            { status: 500 }
        );
    }
}