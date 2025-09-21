import User from "../models/User.js";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;

    // Find both users
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User or friend not found" });
    }

    const isAlreadyFriend = user.friends.includes(friendId);

    if (isAlreadyFriend) {
      // Remove friend - use updateOne to avoid validation issues
      await User.updateOne({ _id: id }, { $pull: { friends: friendId } });
      await User.updateOne({ _id: friendId }, { $pull: { friends: id } });
    } else {
      // Add friend - use updateOne to avoid validation issues
      await User.updateOne({ _id: id }, { $addToSet: { friends: friendId } });
      await User.updateOne({ _id: friendId }, { $addToSet: { friends: id } });
    }

    // Get updated user with populated friends
    const updatedUser = await User.findById(id);
    const friends = await Promise.all(
      updatedUser.friends.map((friendId) => User.findById(friendId))
    );

    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    console.error("Error in addRemoveFriend:", err);
    res.status(500).json({ message: err.message });
  }
};
