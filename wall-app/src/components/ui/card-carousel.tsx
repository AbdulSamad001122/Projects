"use client";

import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { SparklesIcon } from "lucide-react";
import {
  Autoplay,
  EffectCoverflow,
  Navigation,
  Pagination,
} from "swiper/modules";

import { Badge } from "@/components/ui/badge";

interface CarouselImage {
  src: string;
  alt: string;
  title: string;
  uploadedBy: string;
  profileImage: string;
}

interface CarouselProps {
  images: CarouselImage[];
  autoplayDelay?: number;
  showPagination?: boolean;
  showNavigation?: boolean;
}

export const CardCarousel: React.FC<CarouselProps> = ({
  images,
  autoplayDelay = 1500,
  showPagination = true,
  showNavigation = true,
}) => {
  const css = `
    .swiper {
      width: 100%;
      padding-bottom: 50px;
    }

    .swiper-slide {
      background-position: center;
      background-size: cover;
      width: 300px;
    }

    .swiper-slide img {
      display: block;
      width: 100%;
    }

    .swiper-3d .swiper-slide-shadow-left,
    .swiper-3d .swiper-slide-shadow-right {
      background: none;
    }
  `;

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <section className="w-ace-y-4">
      <style>{css}</style>
      <div className="transition-colors duration-300 mx-auto w-full max-w-4xl rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-2 shadow-sm md:rounded-t-[44px]">
        <div className="relative mx-auto flex w-full flex-col rounded-[24px] border border-black/5 dark:border-white/10 bg-neutral-100/10 dark:bg-neutral-900/10 p-2 shadow-sm md:items-start md:gap-8 md:rounded-b-[20px] md:rounded-t-[40px] md:p-2">
          <Badge
            variant="outline"
            className="absolute left-4 top-6 rounded-[14px] border border-black/10 dark:border-white/20 text-base md:left-6"
          >
            <SparklesIcon className="fill-[#EEBDE0] stroke-1 text-neutral-800 dark:text-white" />
            Latest Wallpapers
          </Badge>

          <div className="flex flex-col justify-center pb-2 pl-4 pt-14 md:items-center">
            <div className="flex gap-2">
              <div>
                <h3 className="text-4xl opacity-85 font-bold tracking-tight text-neutral-900 dark:text-white">
                  Wallpaper Craousel
                </h3>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-4">
            <div className="w-full">
              <Swiper
                spaceBetween={50}
                autoplay={{
                  delay: autoplayDelay,
                  disableOnInteraction: false,
                }}
                effect={"coverflow"}
                grabCursor={true}
                centeredSlides={true}
                loop={true}
                slidesPerView={"auto"}
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 100,
                  modifier: 2.5,
                }}
                pagination={showPagination}
                navigation={
                  showNavigation
                    ? {
                        nextEl: ".swiper-button-next",
                        prevEl: ".swiper-button-prev",
                      }
                    : undefined
                }
                modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
              >
                {images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative size-full rounded-3xl overflow-hidden group">
                      {/* Wallpaper Image */}
                      <Image
                        src={image.src}
                        width={500}
                        height={500}
                        className="size-full rounded-xl object-cover group-hover:blur-sm transition-all duration-300"
                        alt={image.alt}
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 text-white dark:text-white flex flex-col justify-center items-center p-4">
                        <h3 className="text-lg font-bold mb-2">
                          {image.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          <Image
                            src={image.profileImage}
                            alt={image.uploadedBy}
                            width={40}
                            height={40}
                            className="rounded-full border"
                          />
                          <p className="text-sm">
                            Uploaded by : <b>{image.uploadedBy}</b>
                          </p>
                        </div>

                        {/* ✅ DOWNLOAD BUTTON */}
                        <button
                          onClick={() =>
                            handleDownload(
                              image.src,
                              `wallpaper-${index + 1}.jpg`
                            )
                          }
                          className="cursor-pointer mt-5 inline-block px-4 py-2 bg-white/80 text-black font-semibold rounded hover:bg-white transition"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
