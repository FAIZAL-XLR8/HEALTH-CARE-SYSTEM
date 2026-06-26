const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const client = twilio(accountSid, authToken);

//sending otp via twilio
const sendOtpToPhoneNumber = async (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }
  try {
    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: "sms" });
    console.log("OTP sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};
const verifyOtp = async (phoneNumber, otp) => {
  try {
    console.log ("this is my otp", otp);
    console.log ("this is my phone number", phoneNumber);
    
    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code: otp });
    console.log("OTP response :", response);
    return response;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};
module.exports = { sendOtpToPhoneNumber, verifyOtp };
