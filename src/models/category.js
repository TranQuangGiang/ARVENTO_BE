import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        nameCategory: {
            type: String,
            require: true
        }
    },
    {
        versionKey: false, timestamps: true,
    }
)
export default mongoose.model("categorys", categorySchema);