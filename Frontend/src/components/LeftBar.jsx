import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HomeOutlined as HomeInActiveIcon,
  Home as HomeActiveIcon,
  NotificationsOutlined as ActivityInActiveIcon,
  Notifications as ActivityActiveIcon,
  ForumOutlined as MessageInActiveIcon,
  Forum as MessageActiveIcon,
  FavoriteBorderOutlined as LikedInActiveIcon,
  Favorite as LikedActiveIcon,
  BookmarkBorderOutlined as SavedInActiveIcon,
  Bookmark as SavedActiveIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import { Groups as GroupsActiveIcon, GroupsOutlined as GroupsInActiveIcon } from "@mui/icons-material";
import { UserContext } from "../context/userContext";
import { SidebarContext } from "../context/sideBarContext";
import socket from "../socketConnection";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/authContext";

const NavItem = ({ path, activeIcon: ActiveIcon, inActiveIcon: InActiveIcon, label }) => {
  const { toggleBar } = useContext(SidebarContext);

  return (
    <NavLink
    to={path}
    className={({ isActive }) =>
      `flex items-center w-full p-3 rounded-xl transition-all duration-200 
      hover:bg-amber-50 hover:translate-x-1 hover:shadow-sm 
      dark:hover:bg-amber-900/10 dark:hover:text-amber-400
      ${isActive ? 
        "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold" : 
        "text-gray-700 dark:text-gray-300 font-medium"
      }`
    }
    onClick={toggleBar}
  >
    {({isActive}) => (
      <div className="flex items-center">
        {isActive ? 
          <ActiveIcon className="text-amber-500 dark:text-amber-400" sx={{ fontSize: 28 }} /> : 
          <InActiveIcon className="text-gray-500 dark:text-gray-400 group-hover:text-amber-500" sx={{ fontSize: 28 }} />
        }
        <p className="ml-4 text-lg">{label}</p>
      </div>
    )}
  </NavLink>
  );
};

const LeftBar = () => {
  const { user } = useContext(UserContext);
  const { isOpen, toggleBar } = useContext(SidebarContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    { path: "/", activeIcon: HomeActiveIcon, inActiveIcon: HomeInActiveIcon, label: "Home" },
    { path: "/activity", activeIcon: ActivityActiveIcon, inActiveIcon: ActivityInActiveIcon, label: "Activity" },
    { path: "/chats", activeIcon: MessageActiveIcon, inActiveIcon: MessageInActiveIcon, label: "Chats" },
    { path: "/groups", activeIcon: GroupsActiveIcon, inActiveIcon: GroupsInActiveIcon, label: "Groups" },
    { path: "/liked", activeIcon: LikedActiveIcon, inActiveIcon: LikedInActiveIcon, label: "Liked" },
    { path: "/saved", activeIcon: SavedActiveIcon, inActiveIcon: SavedInActiveIcon, label: "Saved" },
  ];

  return (
    <>
      <div
        className={`${
          !isOpen ? "left-[-100%]" : "left-0 w-[60vw] sm:w-full z-10"
        } fixed shadow-md sm:static sm:col-span-6 lg:col-span-3 h-[calc(100vh-50px)] sm:h-[calc(100vh-58px)] transition-all duration-300`}
      >
        <div className="bg-white dark:bg-[#101010] dark:text-white w-full h-full">
          <div className="flex flex-col gap-0 mx-4 justify-evenly h-full">
            <NavLink
              to={`/userProfile/${user._id}`}
              className={({ isActive }) =>
                `flex items-center hover:bg-gray-200 dark:hover:bg-[#181818] p-2 rounded-lg ${
                  isActive && "bg-gray-200 dark:bg-[#181818]"
                }`
              }
              onClick={toggleBar}
            >
              <img
                src={user.profilePicture || assets.noAvatar}
                alt="userImage"
                className="h-10 w-10 rounded-full object-cover shadow"
              />
              <div className="ml-3">
                <p className="font-medium">{user.fullname}</p>
                <p className="text-sm opacity-80">
                  @{user.username}
                </p>
              </div>
            </NavLink>
            <hr className="border-black border-opacity-40 dark:border-white dark:border-opacity-20" />
            <ul className="h-[65%] flex flex-col items-start gap-2">
              {navItems.map((item, index) => (
                <NavItem
                  key={index}
                  path={item.path}
                  activeIcon={item.activeIcon}
                  inActiveIcon={item.inActiveIcon}
                  label={item.label}
                />
              ))}
            </ul>
            <hr className="border-black border-opacity-40 dark:border-white dark:border-opacity-20" />
            <button 
  onClick={() => { setIsModalOpen(true) }}
  className="flex items-center p-3 rounded-xl transition-all duration-200
  hover:bg-red-50 hover:translate-x-1 hover:shadow-sm
  dark:hover:bg-red-900/10 dark:hover:text-red-400
  text-red-500 dark:text-red-400"
>
  <LogoutIcon sx={{ fontSize: 28 }} />
  <p className="ml-4 text-lg font-medium">Logout</p>
</button>
          </div>
        </div>
      </div>
      {isModalOpen && <LogoutModal closeModal={() => { setIsModalOpen(false) }}/>}
    </>
  );
};

const LogoutModal = ({ closeModal }) => {
  const { user, dispatch } = useContext(UserContext);
  const { setToken } = useContext(AuthContext);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#101010] p-6 rounded-lg shadow-lg text-center space-y-4 w-[90%] sm:w-[400px]">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Logout Confirmation
        </h2>
        <p className="dark:text-white opacity-80">
          Are you sure you want to log out?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              socket.emit("removeUser", user._id);
              dispatch({ type: "LOGOUT", payload: null });
              setToken(null);
            }}
            className="px-4 py-2 font-medium transition-colors duration-200 bg-red-600 text-white rounded-md hover:bg-red-500"
          >
            Logout
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 font-medium transition-colors duration-200 bg-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftBar;
