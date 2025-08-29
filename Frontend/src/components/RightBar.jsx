import React from "react";
import FollowRequests from "./FollowRequests";
import OnlineFriends from "./OnlineFriends";
import Suggestions from "./Suggestions";

const RightBar = () => {
  return (
    <div className="hidden lg:block col-span-5 overflow-y-scroll scroll-smooth no-scrollbar p-5 pl-2">
      <FollowRequests />
      <OnlineFriends />
      <Suggestions />
      
    </div>
  );
};

export default RightBar;
