const mongoose = require("mongoose");

module.exports.connectToMongoDB = async () => {
  mongoose.set("strictQuery", false);
  mongoose
    .connect(process.env.url_mongodb)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB", err);
    });
};
