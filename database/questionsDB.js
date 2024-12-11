import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  question: String,
});

const questionsModel = mongoose.model("questions_collections", userSchema);

export default questionsModel;
