import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WallpaperCardProps {
  title: string;
  imageUrl: string;
  username?: string;
}

const WallpaperCard: React.FC<WallpaperCardProps> = ({ title, imageUrl, username }) => {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-xl shadow-md rounded-2xl border-none ">
      <div className="relative group">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-60 object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <CardContent className="p-4">
        <h2 className="text-lg font-bold text-gray-800 line-clamp-1">{title}</h2>

        {username && (
          <Badge variant="outline" className="mt-2 text-sm">
            Uploaded by: {username}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default WallpaperCard;
