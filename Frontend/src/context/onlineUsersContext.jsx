import React, { createContext, useState, useEffect } from "react";
import socket from "../socketConnection";

export const OnlineUsersContext = createContext();

export const OnlineUsersProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    socket.on("getUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("getUsers");
  }, []);

  return (
    <OnlineUsersContext.Provider value={{ onlineUsers }}>
      {children}
    </OnlineUsersContext.Provider>
  );
};
