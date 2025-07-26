const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  googleSignIn,
} = require("../Controllers/userController");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../middleware/validation");
const { auth } = require("../middleware/auth");

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/google-signin", googleSignIn);
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);
router.post("/refresh-token", refreshToken);
router.get("/me", auth, getMe);

module.exports = router;
