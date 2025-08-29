import React, { useState, useContext } from "react";
import { Modal, Box, TextField, Button, Typography, Select, MenuItem, Avatar } from "@mui/material";
import { UserContext } from "../context/userContext";
// import axios from "axios";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

const CreateGroupModal = ({ open, onClose, refreshGroups }) => {
  const { user } = useContext(UserContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("privacy", privacy);
      if (avatar) formData.append("avatar", avatar);

      // Log form data before sending
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    const token = localStorage.getItem('token');
      const response = await axiosInstance.post("/api/groups", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
      });
      console.log("Response:", response.data);

      toast.success("Group created successfully!");
      refreshGroups();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrivacy("public");
    setAvatar(null);
    setAvatarPreview("");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        outline: 'none'
      }}>
        <Typography variant="h6" gutterBottom>Create New Group</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <label htmlFor="avatar-upload">
            <Avatar
              src={avatarPreview || assets.noAvatar}
              sx={{ width: 100, height: 100, cursor: 'pointer' }}
            />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <Typography variant="caption">Group Avatar</Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          
          <Select
            fullWidth
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
            margin="dense"
            sx={{ mt: 2 }}
          >
            <MenuItem value="public">Public (Anyone can join)</MenuItem>
            <MenuItem value="private">Private (Admin approval required)</MenuItem>
          </Select>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default CreateGroupModal;