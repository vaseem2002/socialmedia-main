import React, { useContext } from "react";
import { RemoveCircleOutline as DeleteIcon } from "@mui/icons-material";
import { UserContext } from "../context/userContext";
import { format } from "timeago.js";
import { assets } from "../assets/assets";

const Comment = ({ comment, user, post, deleteComment }) => {
  const { user: currentUser } = useContext(UserContext);

  return (
    <div className="flex mb-4 items-center">
      <div className="w-full flex justify-between">
        <div className="flex gap-3 w-[95%]">
          <img
            src={user.profilePicture || assets.noAvatar}
            className="mt-1 block h-9 w-9 rounded-full object-cover"
            alt="avatar"
          />
          <div>
            <p>
              {user.username}{" "}
              <span className="text-[0.8rem] opacity-70">
                {" "}
                ~ {format(comment.createdAt)}
              </span>
            </p>
            <p className="text-sm leading-tight">{comment.text}</p>
          </div>
        </div>
        {(comment.userId === currentUser._id ||
          post.userId === currentUser._id) && (
          <button
            onClick={() => {deleteComment(comment._id)}}
            className="text-red-500 hover:opacity-60"
          >
            <DeleteIcon sx={{ fontSize: 17 }} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Comment;
