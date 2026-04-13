import User from "../models/auth.model.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateAccessToken } from "../utils/token.js";

export const signup = async (req, res) => {
  const { email, password } = req.body;
  const hashed = await hashPassword(password);

  const user = await User.create({ email, password: hashed });

  res.json({ user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = generateAccessToken({ id: user._id });

  res.json({ token });
};
