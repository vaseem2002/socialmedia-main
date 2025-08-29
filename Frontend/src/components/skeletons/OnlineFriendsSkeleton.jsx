import React from "react";

const OnlineFriendsSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-5 dark:bg-[#101010] dark:text-white">
      <div className="flex items-center gap-2">
        <p className="opacity-70">Online Friends</p>
        <div className="mt-0.5 h-2.5 w-2.5 bg-green-500 rounded-full"></div>
      </div>
      {[...Array(3)].map((_, index) => (
        <div key={index} className="flex mt-4 items-center justify-between animate-pulse">
          <div className="flex gap-4 items-center">
            {/* Profile Picture Placeholder */}
            <div className="h-9 w-9 rounded-full bg-gray-300 dark:bg-[#202020]"></div>
            {/* Username Placeholder */}
            <div className="h-4 w-28 bg-gray-300 dark:bg-[#202020] rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OnlineFriendsSkeleton;
