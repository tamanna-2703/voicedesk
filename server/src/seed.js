import mongoose from "mongoose";
import User from "./models/User.js";

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_CLINIC_NAME } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);

// Only create the admin if it doesn't exist yet, so running this twice is safe
const exists = await User.findOne({ email: ADMIN_EMAIL });
if (exists) {
  console.log("Admin already exists, nothing to do");
} else {
  await User.create({
    clinicName: ADMIN_CLINIC_NAME || "My Clinic",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD, // the pre-save hook in User.js hashes this
  });
  console.log(`Admin created: ${ADMIN_EMAIL}`);
}

await mongoose.disconnect();