
import { postModel } from "../models/index.js";
import mongoose from 'mongoose';


const getAllPosts = async (page = 1, limit = 10, filters = {}, sort = { publishedAt: -1, created_at: -1 }) => {
  // Luôn filter theo status = 'published' cho public API
  const publicFilters = {
    ...filters,
    status: 'published'
  };

  const options = {
    page,
    limit,
    lean: true,
    sort,
    populate: {
      path: 'category',
      select: 'slug'
    }
  };
  
  const result = await postModel.paginate(publicFilters, options);
  return result;
};

// Thêm method riêng cho admin để lấy tất cả posts
const getAllPostsAdmin = async (page = 1, limit = 10, filters = {}, sort = { created_at: -1 }) => {
  const options = {
    page,
    limit,
    lean: true,
    sort,
    populate: {
      path: 'category',
      select: 'slug'
    }
  };
  
  const result = await postModel.paginate(filters, options);
  return result;
};
// Lấy danh sách tất cả categories từ posts
const getCategories = async () => {
  try {
    const categories = await postModel.aggregate([
      { $match: { status: 'published', category_name: { $ne: null } } },
      { 
        $group: { 
          _id: '$category_name',
          category_slug: { $first: '$category' },
          count: { $sum: 1 },
          latest_post: { $max: '$publishedAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return categories.map(cat => ({
      name: cat._id,
      slug: cat.category_slug,
      postCount: cat.count,
      latestPost: cat.latest_post
    }));
  } catch (error) {
    const err = new Error("Lỗi khi lấy danh sách categories: " + error.message);
    err.statusCode = 500;
    throw err;
  }
};

// Lọc posts theo category_name (tên hiển thị)
const getPostsByCategoryName = async (categoryName, page = 1, limit = 10) => {
  try {
    const filters = { 
      category_name: { $regex: new RegExp(`^${categoryName}$`, 'i') }, // Case-insensitive exact match
      status: 'published'
    };
    
    const sort = { publishedAt: -1, created_at: -1 };
    
    const options = {
      page,
      limit,
      lean: true,
      sort,
      populate: {
        path: 'author',
        select: 'username'
      }
    };
    
    const result = await postModel.paginate(filters, options);
    
    if (result.docs.length === 0) {
      const error = new Error(`Không tìm thấy bài viết cho danh mục: ${categoryName}`);
      error.statusCode = 404;
      throw error;
    }
    
    return result;
  } catch (error) {
    if (error.statusCode) throw error;
    const err = new Error("Lỗi khi lấy bài viết theo danh mục: " + error.message);
    err.statusCode = 500;
    throw err;
  }
};

const getPostById = async (id) => {
  // Validate ObjectId format trước
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("ID bài viết không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const post = await postModel.findOne({ 
    _id: id, 
    status: 'published' 
  })
    .populate('category', 'slug');

  if (!post) {
    const error = new Error("Không tìm thấy bài viết");
    error.statusCode = 404;
    throw error;
  }
  
  return post;
};

// Method cho admin - có thể lấy theo ID bất kể status
const getPostByIdAdmin = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("ID bài viết không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const post = await postModel.findById(id)


    .populate('category', 'name slug description')
    .populate('author', 'username email');

  if (!post) {
    const error = new Error("Không tìm thấy bài viết");
    error.statusCode = 404;
    throw error;
  }
  
  return post;
};

const createPost = async (data, files = {}) => {
  try {
    // Kiểm tra category_id có tồn tại không
    if (data.category_id) {
      const category = await categoryModel.findById(data.category_id);
      if (!category) {
        const error = new Error("Danh mục không tồn tại");
        error.statusCode = 400;
        throw error;
      }
    }
    
    // Xử lý thumbnail
    if (files.thumbnail && files.thumbnail[0]) {
      data.thumbnail = files.thumbnail[0].url;
    }
    
    // Xử lý album
    if (files.album && files.album.length > 0) {
      data.album = files.album.map(file => file.url);
    }
    
    // Tự động set publishedAt nếu status là published
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    
    const newPost = new postModel(data);

    const savedPost = await newPost.save();
    
    // Populate category info trong response
    return await postModel.findById(savedPost._id).populate('category', 'slug');
  } catch (err) {
    if (err.statusCode) throw err;
    if (err.code === 11000) {
      const error = new Error("Slug đã tồn tại");
      error.statusCode = 409;
      throw error;
    }
    const error = new Error("Tạo bài viết thất bại: " + err.message);
    error.statusCode = 400;
    throw error;
  }
};

const updatePost = async (id, data, files = {}) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID bài viết không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra category_id nếu có
    if (data.category_id) {
      const category = await categoryModel.findById(data.category_id);
      if (!category) {
        const error = new Error("Danh mục không tồn tại");
        error.statusCode = 400;
        throw error;
      }
    }
    
    // Xử lý thumbnail mới
    if (files.thumbnail && files.thumbnail[0]) {
      data.thumbnail = files.thumbnail[0].url;
    }
    
    // Xử lý album mới
    if (files.album && files.album.length > 0) {
      data.album = files.album.map(file => file.url);
    }
    



    // Tự động set publishedAt khi chuyển sang published
    if (data.status === 'published') {
      const currentPost = await postModel.findById(id);
      if (currentPost && currentPost.status !== 'published') {
        data.publishedAt = new Date();
      }
    }
    

    const updatedPost = await postModel.findByIdAndUpdate(id, data, { 
      new: true,
      runValidators: true 
    }).populate('category', 'slug');
    
    if (!updatedPost) {
      const error = new Error("Không tìm thấy bài viết");
      error.statusCode = 404;
      throw error;
    }
    
    return updatedPost;
  } catch (err) {
    if (err.statusCode) throw err;
    if (err.code === 11000) {
      const error = new Error("Slug đã tồn tại");
      error.statusCode = 409;
      throw error;
    }

    const error = new Error("Cập nhật bài viết thất bại: " + err.message);
    error.statusCode = 400;
    throw error;
  }
};

const deletePost = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("ID bài viết không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const deleted = await postModel.findByIdAndDelete(id);
  if (!deleted) {
    const error = new Error("Không tìm thấy bài viết");
    error.statusCode = 404;
    throw error;
  }
  return deleted;
};


const updatePostCategory = async (id, categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("ID bài viết không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error("Category ID không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const post = await postModel.findById(id);
  if (!post) {
    const error = new Error("Bài đăng không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Nếu bạn muốn kiểm tra xem category đã giống rồi thì không cần cập nhật
  if (post.category?.toString() === categoryId) {
    const error = new Error("Bài viết đã có danh mục này");
    error.statusCode = 400;
    throw error;
  }

  const updatedPost = await postModel.findByIdAndUpdate(
    id,
    { category: categoryId },
    { new: true }
  ).populate('category', 'slug'); // chỉ nếu bạn có ref tới category

  if (!updatedPost) {
    const error = new Error("Không tìm thấy bài viết sau cập nhật");
    error.statusCode = 404;
    throw error;
  }

  return updatedPost;
};


export default {
  getAllPosts,       // Public - chỉ published posts
  getAllPostsAdmin, 
  getCategories,     // Admin - tất cả posts
  getPostsByCategoryName,    // Public - chỉ published posts
  getPostById,           // Public - chỉ published posts  
  getPostByIdAdmin,      // Admin - tất cả posts       // Public - chỉ published posts
  createPost,
  updatePost,
  deletePost,
  updatePostCategory
};
