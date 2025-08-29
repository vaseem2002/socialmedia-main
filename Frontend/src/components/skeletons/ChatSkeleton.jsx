import React from "react";

const ChatSkeleton = () => {
  return (
    <>
      <div className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#202020] animate-pulse">
        <div className="flex gap-4 items-center w-full">
          {/* Profile Picture */}
          <div className="h-12 w-14 rounded-full bg-gray-300 dark:bg-[#202020]"></div>
          <div className="flex flex-col gap-2 w-full">
            {/* Username */}
            <div className="h-4 w-32 bg-gray-300 dark:bg-[#202020] rounded"></div>
            {/* Message Preview */}
            <div className="h-3 w-3/4 bg-gray-300 dark:bg-[#202020] rounded"></div>
          </div>
        </div>
      </div>
      <hr className="border border-black dark:border-white opacity-15" />
    </>
  );
};

export default ChatSkeleton;
