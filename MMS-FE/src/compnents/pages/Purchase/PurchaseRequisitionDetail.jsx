
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import purchaseRequisitionService from "../../../api/purchaseRequisitionService";
import { getProducts } from "../../../api/productService";

/**
 * Stat component - Hiển thị một metric với label và value
 */
const Stat = ({ label, value }) => (
    <div className="flex-1 text-center">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
    </div>
);

export default function PurchaseRequisitionDetail() {
    // ==================== ROUTING ====================
    const { id } = useParams(); // Lấy requisition ID từ URL
    const navigate = useNavigate();

    // ==================== STATE MANAGEMENT ====================
    const [data, setData] = useState(null); // Dữ liệu chi tiết phiếu yêu cầu
    const [products, setProducts] = useState([]); // Danh sách products (cho lookup tên)
    const [loading, setLoading] = useState(true); // Loading state
    const [err, setErr] = useState(null); // Error state
    
    // Popup states
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // ==================== HELPER FUNCTIONS ====================
    /**
     * Format date string sang định dạng VN (dd/mm/yyyy)
     *
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date hoặc "-"
     */
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString("vi-VN");
        } catch {
            return dateString;
        }
    };

    /**
     * Format datetime string sang định dạng VN (dd/mm/yyyy hh:mm:ss)
     *
     * @param {string} dateString - ISO datetime string
     * @returns {string} Formatted datetime hoặc "-"
     */
    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        try {
            const d = new Date(dateString);
            return d.toLocaleString("vi-VN");
        } catch {
            return dateString;
        }
    };

    /**
     * Lấy tên sản phẩm từ productId (fallback nếu productName không có)
     *
     * @param {number} productId - Product ID
     * @returns {string} Product name hoặc "-"
     */
    const getProductName = (productId) => {
        if (!productId || !products || products.length === 0) return "-";
        const p = products.find((x) => x.product_id === productId);
        return p ? `${p.sku} - ${p.name}` : "-";
    };

    /**
     * Tính giá trị của một line item
     * Công thức: requestedQty × estimatedUnitPrice
     *
     * @param {Object} item - Purchase requisition item
     * @returns {number} Line value
     */
    const lineValue = (item) => {
        const qty = Number(item?.requestedQty || 0);
        const estimatedUnitPrice = Number(item?.estimatedUnitPrice || 0);
        return Math.round(qty * estimatedUnitPrice * 100) / 100;
    };

    /**
     * Tính tổng giá trị của tất cả items trong phiếu
     * Memoized để tránh re-calculate không cần thiết
     */
    const totalValue = useMemo(() => {
        if (!data || !Array.isArray(data.items)) return 0;
        return data.items.reduce((sum, item) => sum + lineValue(item), 0);
    }, [data]);

    /**
     * Tạo badge hiển thị trạng thái phiếu (RequisitionStatus)
     *
     * @param {string} status - Open/Closed/Converted/Cancelled
     * @returns {JSX.Element} Badge component
     */
    const getStatusBadge = (status) => {
        const statusMap = {
            // RequisitionStatus
            Open: { label: "Đang mở", color: "bg-blue-100 text-blue-800" },
            Closed: { label: "Đã đóng", color: "bg-gray-100 text-gray-800" },
            Converted: { label: "Đã chuyển đổi", color: "bg-green-100 text-green-800" },
            Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
            // ApprovalStatus (fallback nếu backend trả nhầm)
            Draft: { label: "Bản nháp", color: "bg-gray-100 text-gray-800" },
            Pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
            Approved: { label: "Đã tạo", color: "bg-green-100 text-green-800" },
            Rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
        };

        const statusInfo = statusMap[status] || { label: status || "Đang mở", color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
        );
    };

    /**
     * Tạo badge hiển thị trạng thái duyệt (ApprovalStatus)
     *
     * @param {string} approvalStatus - Draft/Pending/Approved/Rejected/Cancelled
     * @returns {JSX.Element} Badge component
     */
    const getApprovalStatusBadge = (approvalStatus) => {
        const statusMap = {
            Draft: { label: "Bản nháp", color: "bg-gray-100 text-gray-800" },
            Pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
            Approved: { label: "Đã tạo", color: "bg-green-100 text-green-800" },
            Rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
            Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
        };

        const status = statusMap[approvalStatus] || { label: approvalStatus || "Bản nháp", color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
        {status.label}
      </span>
        );
    };

    // ==================== USEEFFECT: LOAD DATA ====================
    /**
     * Load chi tiết phiếu yêu cầu từ backend khi component mount
     *
     * FLOW:
     * 1. Fetch chi tiết phiếu yêu cầu theo ID
     * 2. Fetch danh sách products (optional, cho lookup tên sản phẩm)
     *
     * Note: Sử dụng mounted flag để tránh memory leak khi component unmount
     */
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setErr(null);

                // 1. Fetch chi tiết phiếu yêu cầu
                const detailData = await purchaseRequisitionService.getRequisitionById(id);

                // 2. Fetch danh sách products (optional, cho product name lookup)
                try {
                    const prodData = await getProducts();
                    if (mounted) {
                        setProducts(Array.isArray(prodData) ? prodData : []);
                    }
                } catch (e) {
                    console.warn("Could not load products:", e);
                }

                // Set data vào state
                if (mounted) {
                    setData(detailData);
                }
            } catch (e) {
                if (mounted) {
                    setErr(
                        e?.response?.data?.message ||
                        e.message ||
                        "Không thể tải dữ liệu phiếu yêu cầu"
                    );
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        // Cleanup function
        return () => {
            mounted = false;
        };
    }, [id]);

    // ==================== APPROVE/REJECT HANDLERS ====================
    /**
     * Xử lý submit phiếu yêu cầu để chuyển sang trạng thái Pending
     */
    const handleSubmit = async () => {
        try {
            setIsProcessing(true);
            await purchaseRequisitionService.submitRequisition(id);
            toast.success("Tạo đơn thành công!");
            // Reload data
            const detailData = await purchaseRequisitionService.getRequisitionById(id);
            setData(detailData);
        } catch (error) {
            console.error("Error submitting requisition:", error);
            toast.error(error.response?.data?.message || "Không thể gửi phiếu yêu cầu");
        } finally {
            setIsProcessing(false);
        }
    };

    // ==================== RENDER ====================
    // Loading state
    if (loading) return <div className="p-6">Đang tải...</div>;

    // Error state
    if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;

    // Empty data state
    if (!data) return <div className="p-6">Không có dữ liệu</div>;

    const items = data.items || [];
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.requestedQty || 0), 0);
    
    // Check if user can submit (must be requester and status is Draft)
    const canSubmit = (data.approvalStatus === 'Draft' || data.status === 'Draft');

    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* ==================== HEADER ==================== */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-3 py-1.5 rounded border hover:bg-gray-50"
                        title="Quay lại trang trước"
                    >
                        ←
                    </button>
                    <h1 className="text-2xl font-semibold">
                        Phiếu yêu cầu: {data.requisitionNo || `#${id}`}
                    </h1>
                </div>
                {/* Submit button - chỉ hiển thị nếu status là Draft */}
                {canSubmit && (
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {isProcessing ? "Đang xử lý..." : "Xác nhận"}
                    </button>
                )}
            </div>

            {/* ==================== LAYOUT ==================== */}
            {/* Grid layout: 2 cột trên desktop (left: items, right: sidebar info) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ==================== LEFT CONTENT ==================== */}
                <div className="lg:col-span-2 space-y-4">
                    {/* ==================== SUMMARY STATS ==================== */}
                    {/* Hiển thị các metrics quan trọng: tổng giá trị, số SP, trạng thái */}
                    <div className="border rounded p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Số lượng sản phẩm */}
                            <Stat label="Số sản phẩm" value={totalItems} />
                            <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                            {/* Tổng số lượng */}
                            <Stat label="Tổng số lượng" value={totalQuantity.toLocaleString()} />
                            <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                            {/* Trạng thái phiếu */}
                            <div className="flex-1 text-center">
                                <div className="text-sm text-gray-500">Trạng thái</div>
                                <div className="text-xl font-semibold flex justify-center">
                                    {getStatusBadge(data.status)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==================== ITEMS TABLE ==================== */}
                    {/* Bảng danh sách sản phẩm trong phiếu yêu cầu */}
                    <div className="border rounded">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <div className="font-medium">Danh sách sản phẩm</div>
                            {/* Chỉ hiển thị nút edit khi status là Draft */}
                            {data.status === 'Draft' && (
                                <button
                                    onClick={() => navigate(`/purchase/purchase-requisitions/${id}/edit`)}
                                    className="text-blue-600 hover:underline text-sm"
                                    title="Chỉnh sửa phiếu yêu cầu"
                                >
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>
                        <div className="p-4">
                            {items.length === 0 ? (
                                <div className="text-gray-500">Không có sản phẩm nào</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    {/*
                    TABLE COLUMNS:
                    - #: STT
                    - Mã sản phẩm: productCode (VARCHAR 50)
                    - Tên sản phẩm: productName (VARCHAR 255)
                    - Đơn vị: uom (VARCHAR 50)
                    - Số lượng: requestedQty (DECIMAL 18,2)
                    - Đơn giá: targetUnitPrice (DECIMAL 18,2)
                    - Thành tiền: requestedQty × targetUnitPrice
                    - Ghi chú: note (TEXT) - thêm cột mới
                  */}
                                    <table className="min-w-full text-sm">
                                        <thead>
                                        <tr className="text-left text-gray-500 border-b">
                                            <th className="py-2 pr-4">#</th>
                                            <th className="py-2 pr-4">Sản phẩm</th>
                                            <th className="py-2 pr-4">Số lượng</th>
                                            <th className="py-2 pr-4">Ngày giao hàng</th>
                                            <th className="py-2 pr-4">Ghi chú</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {items.map((item, index) => {
                                            const itemTotal = lineValue(item);
                                            return (
                                                <tr key={item.priId || index} className="border-t">
                                                    {/* STT */}
                                                    <td className="py-2 pr-4">{index + 1}</td>
                                                    {/* Sản phẩm (hiển thị từ product entity) */}
                                                    <td className="py-2 pr-4">
                                                        {item.productCode && item.productName
                                                            ? `${item.productCode} - ${item.productName}`
                                                            : item.productCode || item.productName || getProductName(item.productId)}
                                                    </td>
                                                    {/* Số lượng yêu cầu */}
                                                    <td className="py-2 pr-4">
                                                        {Number(item.requestedQty || 0).toLocaleString()}
                                                    </td>
                                                    {/* Ngày giao hàng */}
                                                    <td className="py-2 pr-4">
                                                        {item.deliveryDate ? formatDate(item.deliveryDate) : "-"}
                                                    </td>
                                                    {/* Ghi chú */}
                                                    <td className="py-2 pr-4 text-gray-600">
                                                        {item.note || "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                        <tfoot>
                                        <tr className="border-t-2 font-semibold">
                                            <td colSpan={2} className="py-2 pr-4 text-right">Tổng cộng:</td>
                                            <td className="py-2 pr-4">{totalQuantity.toLocaleString()}</td>
                                            <td colSpan={2} className="py-2 pr-4"></td>
                                        </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ==================== RIGHT SIDEBAR ==================== */}
                {/* Sidebar hiển thị thông tin chi tiết phiếu */}
                <aside className="space-y-4 lg:sticky lg:top-4">
                    {/* ==================== STATUS CARD ==================== */}
                    {/* Hiển thị trạng thái phiếu và trạng thái duyệt */}
                    <div className="border rounded">
                        <div className="px-4 py-3 border-b font-medium">Trạng thái</div>
                        <div className="p-4 text-sm space-y-2">
                            {/* Trạng thái phiếu: Open/Closed/Converted/Cancelled */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Trạng thái:</span>
                                {getStatusBadge(data.status)}
                            </div>
                            {/* Trạng thái duyệt: Draft/Pending/Approved/Rejected/Cancelled */}
                            {data.approvalStatus && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Trạng thái duyệt:</span>
                                    {getApprovalStatusBadge(data.approvalStatus)}
                                </div>
                            )}
                            {/* Thời gian duyệt (nếu đã duyệt) */}
                            {data.approvedAt && (
                                <div className="text-xs text-gray-500 mt-2">
                                    Đã duyệt: {formatDateTime(data.approvedAt)}
                                </div>
                            )}
                            {/* Ghi chú duyệt / Lý do từ chối */}
                            {data.approvalRemarks && (
                                <div className="text-xs text-gray-500 mt-2">
                                    {data.approvalStatus === 'Rejected' ? 'Lý do từ chối: ' : 'Ghi chú: '}
                                    {data.approvalRemarks}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ==================== BASIC INFO CARD ==================== */}
                    {/* Hiển thị các thông tin cơ bản của phiếu yêu cầu */}
                    <div className="border rounded">
                        <div className="px-4 py-3 border-b font-medium">
                            Thông tin cơ bản
                        </div>
                        <div className="p-4 space-y-2 text-sm">
                            {/* Mã phiếu (requisition_no) */}
                            <div>
                                <span className="text-gray-500">Mã phiếu: </span>
                                <span className="font-medium">
                  {data.requisitionNo || "-"}
                </span>
                            </div>
                            {/* Người yêu cầu (requesterName) */}
                            <div>
                                <span className="text-gray-500">Người yêu cầu: </span>
                                <span className="font-medium">
                  {data.requesterName || "Chưa gán người yêu cầu"}
                </span>
                            </div>
                            {/* Phòng ban */}
                            {data.departmentName && (
                                <div>
                                    <span className="text-gray-500">Phòng ban: </span>
                                    <span className="font-medium">{data.departmentName}</span>
                                </div>
                            )}
                            {/* Ngày cần hàng */}
                            {data.neededBy && (
                                <div>
                                    <span className="text-gray-500">Ngày cần hàng: </span>
                                    <span className="font-medium">{formatDate(data.neededBy)}</span>
                                </div>
                            )}
                            {/* Độ ưu tiên */}
                            {data.priority && (
                                <div>
                                    <span className="text-gray-500">Độ ưu tiên: </span>
                                    <span className="font-medium">{data.priority}</span>
                                </div>
                            )}
                            {/* Người duyệt (approverName) */}
                            {data.approverName && (
                                <div>
                                    <span className="text-gray-500">Người duyệt: </span>
                                    <span className="font-medium">{data.approverName}</span>
                                </div>
                            )}
                            {/* Ngày tạo (createdAt) */}
                            <div>
                                <span className="text-gray-500">Ngày tạo: </span>
                                <span className="font-medium">
                  {formatDateTime(data.createdAt)}
                </span>
                            </div>
                            {/* Ngày duyệt (approvedAt) */}
                            {data.approvedAt && (
                                <div>
                                    <span className="text-gray-500">Ngày duyệt: </span>
                                    <span className="font-medium">
                    {formatDateTime(data.approvedAt)}
                  </span>
                                </div>
                            )}
                            {/* Ngày cập nhật (updatedAt) */}
                            {data.updatedAt && (
                                <div>
                                    <span className="text-gray-500">Ngày cập nhật: </span>
                                    <span className="font-medium">
                    {formatDateTime(data.updatedAt)}
                  </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ==================== PURPOSE CARD ==================== */}
                    {/* Hiển thị mục đích sử dụng (purpose) */}
                    <div className="border rounded">
                        <div className="px-4 py-3 border-b font-medium">
                            Mục đích sử dụng
                        </div>
                        <div className="p-4 text-sm whitespace-pre-wrap">
                            {data.purpose ? (
                                data.purpose
                            ) : (
                                <span className="text-gray-500">Không có mục đích</span>
                            )}
                        </div>
                    </div>

                    {/* ==================== JUSTIFICATION CARD ==================== */}
                    {/* Hiển thị lý do/biện minh (justification) */}
                    {data.justification && (
                        <div className="border rounded">
                            <div className="px-4 py-3 border-b font-medium">
                                Lý do / Biện minh
                            </div>
                            <div className="p-4 text-sm whitespace-pre-wrap">
                                {data.justification}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
