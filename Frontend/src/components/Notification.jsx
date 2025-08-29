import React from "react";
import { format } from "timeago.js";
import { assets } from "../assets/assets";
import { useNavigate } from 'react-router-dom';
const Notification = ({ sender, content, isRead, createdAt, type, referenceId }) => {

  const navigate = useNavigate();

  const handleClick = () => {
    if (type === "group-message") {
      navigate(`/groups/${referenceId}`);
    }
  };
  return (
    <>
      <div className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-[#202020] px-2 py-3" onClick={handleClick}>
        <div className="flex gap-2 sm:gap-4 items-center w-full">
          <img
            src={sender.profilePicture || assets.noAvatar}
            className="block h-9 w-9 rounded-full object-cover"
            alt="sender image"
          />

          <p className="text-sm md:text-base">
            <span className="font-semibold">{sender.username} </span>
            {content}
          </p>
        </div>

        <div className="flex w-[25%] gap-2 items-center justify-end">
          <p className="text-xs opacity-70">{format(createdAt)}</p>
          {!isRead && <p className="h-2.5 w-2.5 rounded-full bg-blue-500"></p>}
        </div>
      </div>
      <hr className="border border-black dark:border-white opacity-15" />
    </>
  );
};

export default Notification;
