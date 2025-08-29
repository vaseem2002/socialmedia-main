import React from "react";

const CommentSkeleton = () => {
  return (
    <div className="flex mb-4 items-center animate-pulse">
      <div className="w-full flex justify-between">
        <div className="flex gap-3 w-[95%]">
          {/* Profile Picture */}
          <div className="h-9 w-9 rounded-full bg-gray-300 dark:bg-[#202020]"></div>
          {/* Text Section */}
          <div className="flex flex-col gap-1 w-full">
            {/* Username and Time */}
            <div className="h-4 w-1/3 bg-gray-300 dark:bg-[#202020] rounded"></div>
            {/* Comment Text */}
            <div className="h-3 w-2/3 bg-gray-300 dark:bg-[#202020] rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSkeleton;
