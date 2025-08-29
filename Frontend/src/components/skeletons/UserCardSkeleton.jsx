import React from "react";

const UserCardSkeleton = () => {
  return (
    <div className="flex mb-4 items-center justify-between animate-pulse">
      <div className="flex gap-4 items-center">
        {/* Skeleton for avatar */}
        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-[#202020]" />
        {/* Skeleton for username */}
        <div className="h-5 w-32 rounded bg-gray-300 dark:bg-[#202020]" />
      </div>
      {/* Skeleton for follow/unfollow button */}
      <div className="h-8 w-[100px] rounded-md bg-gray-300 dark:bg-[#202020]" />
    </div>
  );
};

export default UserCardSkeleton;