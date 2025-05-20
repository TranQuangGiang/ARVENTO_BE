import categoryModel from "../models/category.model";
import Joi from 'joi';

const categorySchema = Joi.object({
    nameCategory: Joi.string().required().min(6),
})
export const get = async (req, res) => {
    try {
        const categorys = await categoryModel.find();
        return res.status(200).json({
            category: categorys,
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}
export const getOne = async (req, res) => {
    try {
        const category = await categoryModel.findById(req.params.id);
        if (!category) {
            return res.status(400).json({
                message: "Danh mục không tồn tại"
            })
        }
        return res.status(200).json({
            message: "Thấy",
            category,
        })
    } catch (error) {
        
    }
}
export const create = async(req, res) => {
    try {
        const { error,value } = categorySchema.validate(req.body, {
            abortEarly: false,
        })
        if (error) {
            const errors = error.details.map((error => error.message));
            return res.status(400).json(errors);
        }
        const newCategory = await categoryModel.create(value);
        return res.status(201).json({
            message: "Thêm mới thành công",
            category: newCategory,
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}
export const update = async (req, res) => {
    try {
        const { error, value} = categorySchema.validate(req.body, {
            abortEarly: false
        })
        if (error) {
            const errors = error.details.map((error => error.message));
            return res.status(400).json(errors);
        }
        const newCategory = await categoryModel.findByIdAndUpdate(req.params.id, value);
        return res.status(200).json({
            message: "Cập nhập thành công !",
            newCategory,
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}
export const deleteCategory = async (req, res) => {
    try {
        const category = await categoryModel.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(400).json({
                message: "Danh mục không tồn tại"
            })
        }
        return res.status(200).json({
            message: "Xóa thành công",
            category,
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}