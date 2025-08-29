import React from "react";

const RequestSkeleton = () => {
  return (
    <div className="flex mb-3 items-center justify-between animate-pulse">
      {/* Left Section: Profile Picture and Details */}
      <div className="flex gap-2 items-center">
        {/* Profile Picture Placeholder */}
        <div className="h-9 w-9 rounded-full bg-gray-300 dark:bg-[#202020]"></div>
        {/* Username and Mutual Friends Placeholder */}
        <div>
          <div className="h-4 w-28 bg-gray-300 dark:bg-[#202020] rounded mb-1"></div>
          <div className="h-3 w-20 bg-gray-300 dark:bg-[#202020] rounded"></div>
        </div>
      </div>
      {/* Right Section: Buttons Placeholder */}
      <div className="flex">
        <div className="h-8 w-16 bg-gray-300 dark:bg-[#202020] rounded mr-2"></div>
        <div className="h-8 w-16 bg-gray-300 dark:bg-[#202020] rounded"></div>
      </div>
    </div>
  );
};

export default RequestSkeleton;