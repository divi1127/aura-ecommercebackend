import mongoose from 'mongoose';

const otpRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phno: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: 'United States' }
  },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 900 } // Automatically delete after 15 minutes
});

const OtpRegistration = mongoose.model('OtpRegistration', otpRegistrationSchema);
export default OtpRegistration;
