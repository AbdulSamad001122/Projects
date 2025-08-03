"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { useUser } from "@clerk/nextjs";
import { CardCarousel } from "@/components/ui/card-carousel";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import WrapButton from "@/components/ui/wrap-button";
import { Globe } from "lucide-react";


interface Wallpaper {
  _id: string;
  title: string;
  image_detail: {
    public_id: string;
    secure_url: string;
  };
  user_detail: {
    user_clerk_Id: string;
    user_firstname: string;
  };
}

interface CarouselImage {
  src: string;
  alt: string;
  title: string;
  uploadedBy: string;
  profileImage: string;
}

const AllWallpapersPage = () => {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchAllWallpapers = async () => {
      try {
        const response = await axios.get("/api/show-wall");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.wallpapers;

        setWallpapers(data || []);

        // Fetch profile images for each uploader from Clerk
        const imagesWithUserInfo = await Promise.all(
          (data || []).map(async (wp: Wallpaper) => {
            let profileImage = "";
            try {
              const res = await axios.get(
                `/api/clerk-user-info/${wp.user_detail.user_clerk_Id}`
              );
              profileImage = res.data.imageUrl || "";
            } catch (err) {
              console.error("Error fetching Clerk image", err);
            }

            return {
              src: wp.image_detail.secure_url,
              alt: wp.title,
              title: wp.title,
              uploadedBy: wp.user_detail.user_firstname,
              profileImage,
            };
          })
        );

        setCarouselImages(imagesWithUserInfo);
      } catch (error) {
        console.error("Failed to fetch wallpapers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWallpapers();
  }, []);

  if (loading) {
    return (
      <p className="text-center mt-10 text-white">Loading wallpapers...</p>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10">
        <Navbar />
        <ThemeToggleButton />
        <WrapButton className="mt-10" href="/add-wall">
          <Globe className="animate-spin " />
          Get started
        </WrapButton>

        <div className="w-full max-w-6xl mx-auto pt-20 px-4">
          {carouselImages.length > 0 ? (
            <CardCarousel
              images={carouselImages}
              autoplayDelay={2000}
              showPagination={true}
              showNavigation={true}
            />
          ) : (
            <p className="text-white text-center">No wallpapers found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllWallpapersPage;
