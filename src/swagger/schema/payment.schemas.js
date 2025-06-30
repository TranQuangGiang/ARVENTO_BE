/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - order
 *         - amount
 *       properties:
 *         order:
 *           type: string
 *           description: ID của đơn hàng
 *           example: "507f1f77bcf86cd799439011"
 *         amount:
 *           type: number
 *           description: Số tiền thanh toán
 *           example: 100000
 *         note:
 *           type: string
 *           description: Ghi chú thanh toán
 *           example: "Thanh toán đơn hàng"
 *     
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của payment
 *         order:
 *           type: string
 *           description: ID của đơn hàng
 *         user:
 *           type: string
 *           description: ID của người dùng
 *         amount:
 *           type: number
 *           description: Số tiền thanh toán
 *         method:
 *           type: string
 *           enum: [cod, banking, zalopay, momo]
 *           description: Phương thức thanh toán
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded, refund_requested]
 *           description: Trạng thái thanh toán
 *         paymentUrl:
 *           type: string
 *           description: URL thanh toán (cho online payment)
 *         transactionId:
 *           type: string
 *           description: ID giao dịch từ gateway
 *         paidAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian thanh toán thành công
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo payment
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật payment
 *     
 *     ZaloPayResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/PaymentResponse'
 *         - type: object
 *           properties:
 *             appTransId:
 *               type: string
 *               description: App transaction ID từ ZaloPay
 *             zpTransId:
 *               type: string
 *               description: ZaloPay transaction ID
 *             gatewayResponse:
 *               type: object
 *               description: Response từ ZaloPay gateway
 *     
 *     MoMoResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/PaymentResponse'
 *         - type: object
 *           properties:
 *             requestId:
 *               type: string
 *               description: Request ID từ MoMo
 *             momoTransId:
 *               type: string
 *               description: MoMo transaction ID
 *             gatewayResponse:
 *               type: object
 *               description: Response từ MoMo gateway
 *     
 *     PaymentCallback:
 *       type: object
 *       description: Callback data từ payment gateway
 *       properties:
 *         return_code:
 *           type: integer
 *           description: Mã trả về (ZaloPay)
 *         return_message:
 *           type: string
 *           description: Thông báo trả về (ZaloPay)
 *         resultCode:
 *           type: integer
 *           description: Mã kết quả (MoMo)
 *         message:
 *           type: string
 *           description: Thông báo (MoMo)
 *     
 *     PaymentHistory:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Trạng thái
 *         changedBy:
 *           type: string
 *           description: ID người thay đổi
 *         changedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian thay đổi
 *         note:
 *           type: string
 *           description: Ghi chú
 *     
 *     RefundRequest:
 *       type: object
 *       required:
 *         - paymentId
 *         - reason
 *       properties:
 *         paymentId:
 *           type: string
 *           description: ID của payment cần hoàn tiền
 *           example: "507f1f77bcf86cd799439011"
 *         reason:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *           description: Lý do hoàn tiền
 *           example: "Sản phẩm bị lỗi"
 *     
 *     PaymentStatusQuery:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Trạng thái truy vấn thành công
 *         data:
 *           type: object
 *           description: Dữ liệu từ gateway
 *           properties:
 *             return_code:
 *               type: integer
 *               description: Mã trả về
 *             return_message:
 *               type: string
 *               description: Thông báo
 *             amount:
 *               type: number
 *               description: Số tiền
 *             status:
 *               type: string
 *               description: Trạng thái giao dịch
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default {};
