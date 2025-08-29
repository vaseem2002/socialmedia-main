import React from "react";

const PostSkeleton = () => {
  return (
    <div className="bg-white mb-5 p-3 sm:p-4 rounded-lg shadow dark:bg-[#101010] dark:text-white animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Profile Picture */}
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-300 dark:bg-[#202020]"></div>
          <div>
            {/* Username */}
            <div className="h-4 w-24 bg-gray-300 dark:bg-[#202020] rounded mb-1"></div>
            {/* Time */}
            <div className="h-3 w-16 bg-gray-300 dark:bg-[#202020] rounded"></div>
          </div>
        </div>
        {/* Menu Icon */}
        <div className="h-4 w-4 bg-gray-300 dark:bg-[#202020] rounded"></div>
      </div>
      {/* Image or Video */}
      <div className="pt-3">
        <div className="h-64 w-full bg-gray-300 dark:bg-[#202020] rounded"></div>
      </div>
      {/* Description */}
      <div className="mt-2 space-y-2">
        <div className="h-4 w-3/4 bg-gray-300 dark:bg-[#202020] rounded"></div>
        <div className="h-4 w-1/2 bg-gray-300 dark:bg-[#202020] rounded"></div>
      </div>
      {/* Actions */}
      <div className="flex justify-between pt-3">
        <div className="flex gap-5">
          {/* Like */}
          <div className="flex gap-1.5 items-center">
            <div className="h-5 w-5 bg-gray-300 dark:bg-[#202020] rounded"></div>
            <div className="h-4 w-6 bg-gray-300 dark:bg-[#202020] rounded"></div>
          </div>
          {/* Comment */}
          <div className="flex gap-1.5 items-center">
            <div className="h-5 w-5 bg-gray-300 dark:bg-[#202020] rounded"></div>
            <div className="h-4 w-6 bg-gray-300 dark:bg-[#202020] rounded"></div>
          </div>
          {/* Share */}
          <div className="h-5 w-5 bg-gray-300 dark:bg-[#202020] rounded"></div>
        </div>
        {/* Save */}
        <div className="h-5 w-5 bg-gray-300 dark:bg-[#202020] rounded"></div>
      </div>
    </div>
  );
};

export default PostSkeleton;
