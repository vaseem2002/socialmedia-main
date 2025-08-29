import React from "react";

const SuggestionSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 pb-5 mb-5 dark:bg-[#101010] dark:text-white">
      <p className="opacity-70">Suggestions for you</p>
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex mt-4 items-center justify-between animate-pulse">
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
          {/* Follow Button Placeholder */}
          <div className="h-8 w-[100px] bg-gray-300 dark:bg-[#202020] rounded-md"></div>
        </div>
      ))}
    </div>
  );
};

export default SuggestionSkeleton;
