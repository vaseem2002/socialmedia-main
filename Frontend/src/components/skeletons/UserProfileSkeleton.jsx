import React from "react";
import PostSkeleton from "./PostSkeleton";

const UserProfileSkeleton = () => {
  return (
    <div className="relative overflow-y-scroll scroll-smooth no-scrollbar col-span-12 sm:col-span-9 lg:col-span-6 animate-pulse">
      {/* Cover Photo */}
      <div className="h-[170px] sm:h-[220px] w-full bg-gray-300 dark:bg-[#202020] rounded"></div>
      {/* Profile Picture */}
      <div className="h-[100px] w-[100px] sm:h-[110px] sm:w-[110px] bg-gray-300 dark:bg-[#202020] rounded-full absolute top-[120px] sm:top-[160px] left-0 right-0 mx-auto border-2 border-transparent"></div>
      {/* User Info Section */}
      <div className="w-full lg:w-[85%] mx-auto mt-1 mb-4 p-4 pt-[55px] bg-white dark:bg-[#101010] flex flex-col gap-3 items-center dark:text-white rounded-md shadow">
        {/* Username */}
        <div className="h-6 w-[150px] bg-gray-300 dark:bg-[#202020] rounded"></div>
        {/* Stats (Posts, Followers, Following) */}
        <div className="flex justify-center gap-10 w-full text-sm font-medium">
          <div className="text-center">
            <div className="h-5 w-[50px] bg-gray-300 dark:bg-[#202020] rounded mx-auto mb-1"></div>
            <div className="h-4 w-[70px] bg-gray-300 dark:bg-[#202020] rounded mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="h-5 w-[50px] bg-gray-300 dark:bg-[#202020] rounded mx-auto mb-1"></div>
            <div className="h-4 w-[70px] bg-gray-300 dark:bg-[#202020] rounded mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="h-5 w-[50px] bg-gray-300 dark:bg-[#202020] rounded mx-auto mb-1"></div>
            <div className="h-4 w-[70px] bg-gray-300 dark:bg-[#202020] rounded mx-auto"></div>
          </div>
        </div>
        {/* Actions */}
        <div className="w-[80%] h-[40px] rounded bg-gray-300 dark:bg-[#202020]"></div>
      </div>
      {/* Posts Section */}
      <div className="pt-2 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default UserProfileSkeleton;