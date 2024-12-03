import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  user_name: String,
  user_ID: String,
  user_points: Number,
  no_submission_perDay: Number,
  added_date: String,
});

const userModel = mongoose.model("user_collections", userSchema);

export default userModel;
