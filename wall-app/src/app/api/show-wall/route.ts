import { connectDB } from "@/lib/connectDB";
import { NextRequest, NextResponse } from "next/server";
import Wallpaper from "@/models/Wallpaper";

connectDB();

export async function GET(request: NextRequest) {

    const all_wallpapers = await Wallpaper.find()

    console.log(all_wallpapers)

    return NextResponse.json(all_wallpapers, { status: 200 })
}
