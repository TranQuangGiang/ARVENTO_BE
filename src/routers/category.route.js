import { Router } from "express"; 
import { create, deleteCategory, get, getOne, update } from "../controllers/category";

const router = Router();
router.get(`/categorys`, get);
router.get(`/categorys/:id`, getOne);
router.post(`/categorys`, create);
router.put(`/categorys/:id`, update);
router.delete(`/categorys/:id`, deleteCategory);
export default router