import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"; // Import the plugin

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxLength: 100,
    },
    slug: {
      type: String,
      required: true,
      maxLength: 100,
    },
    description: {
      type: String,
      required: false,
    },
     image:{
  url: String,
  alt: String
},
  },
  
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

categorySchema.plugin(mongoosePaginate); // Apply the plugin to the category schema

export default mongoose.model("Category", categorySchema);