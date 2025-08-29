// Install axios first: npm install axios
import axios from "axios";

async function joinGroup() {
  try {
    const groupId = "680f9b2b2ea67efd9ee48988"; // replace with your group ID
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGRjOWVmMGVkNTMzZTJiYjBmYmZlNSIsImlhdCI6MTc0NTg1MzU5M30.X6-JP_bCXEGNleebidkiSUfO9ffpOzodMXcT1RGK-GQ"; // replace with User B's JWT token

    const response = await axios.post(
      `http://localhost:8000/api/groups/join/${groupId}`,
      {}, // body is empty
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Join Group Success:", response.data);
  } catch (error) {
    console.error("❌ Error joining group:", error.response?.data || error.message);
  }
}

joinGroup();
