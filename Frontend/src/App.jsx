import React, { useContext } from "react";
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import Layout from "./Layout.jsx";
import Home from "./pages/Home.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Activity from "./pages/Activity.jsx";
import Chats from "./pages/Chats.jsx";
import Messages from "./pages/Messages.jsx";
import Liked from "./pages/Liked.jsx";
import Saved from "./pages/Saved.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
// import SignUp from "./pages/SignUp.jsx"
import { ToastContainer } from "react-toastify";
import { AuthContext } from "./context/authContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import GroupChat from "./pages/GroupChat.jsx";
import GroupList from "./components/GroupList.jsx"; // New component
import CreateGroupModal from "./components/CreateGroupModal.jsx";

const App = () => {
  const { token } = useContext(AuthContext);

  const ProtectedRoute = ({ children }) => {
    if (!token) return <Navigate to="/login" />;
    return children;
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="" element={<ErrorBoundary><Home /></ErrorBoundary>} />
          <Route path="userProfile/:userId" element={<ErrorBoundary><UserProfile /></ErrorBoundary>} />
          <Route path="chats" element={<ErrorBoundary><Chats /></ErrorBoundary>} />
          <Route path="chats/:chatId/:senderId" element={<ErrorBoundary><Messages /></ErrorBoundary>} />
          <Route path="activity" element={<ErrorBoundary><Activity /></ErrorBoundary>} />
          <Route path="liked" element={<ErrorBoundary><Liked /></ErrorBoundary>} />
          <Route path="saved" element={<ErrorBoundary><Saved /></ErrorBoundary>} />
          <Route path="groups" element={<ErrorBoundary><GroupList /></ErrorBoundary>} />
          <Route path="groups/:groupId" element={<ErrorBoundary><GroupChat /></ErrorBoundary>} />
        </Route>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />

      </>
        //  <Route path="/register" element={token ? <Navigate to="/" /> : <SignUp />} />
    )
  );

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer autoClose={2000} />
    </>
  );
}

export default App;