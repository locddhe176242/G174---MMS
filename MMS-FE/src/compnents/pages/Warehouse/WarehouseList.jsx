import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import dayjs from "dayjs";
import {warehouseService} from "../../../api/warehouseService.js";
import Pagination from "../../common/Pagination.jsx";

export default function WarehouseList() {
    const [warehouses, setWarehouses] = useState([]); // Lưu trữ danh sách kho hàng
    const [loading, setLoading] = useState(true);  // Quản lý trạng thái loading khi fetch data
    const [error, setError] = useState(null); // Lưu trữ thông báo lỗi nếu có

    const [searchKeyword, setSearchKeyword] = useState("");// Từ khóa tìm kiếm
    const [currentPage, setCurrentPage] = useState(0); // Trang hiện tại (bắt đầu từ 0)
    const [totalPages, setTotalPages] = useState(0);// Tổng số trang
    const [totalElements, setTotalElements] = useState(0);// Tổng số phần tử
    const [pageSize, setPageSize] = useState(10);// Số phần tử trên mỗi trang

    //  States cho bộ lọc
    const [filterNameOrCode, setFilterNameOrCode] = useState(""); // Lọc theo tên hoặc mã
    const [filterStatus, setFilterStatus] = useState("All"); // Lọc theo trạng thái (All/Active/Inactive)

    // Confirm modal state
    const [confirmState, setConfirmState] = useState({
        open: false, // Trạng thái hiển thị modal
        action: null, // Hành động (deactivate/restore)
        warehouseId: null,  // ID của kho cần thực hiện hành động
        message: "", // Thông báo xác nhận
    });

    // Toast state
    const [toast, setToast] = useState({
        open: false, // Trạng thái hiển thị toast
        message: "",  // Nội dung thông báo
        type: "success" // Loại thông báo (success/error)
    }); 

    //Hàm fetch dữ liệu kho
    const fetchWarehouses = async (
        page = 0, // Trang cần lấy
        keyword = "", // Từ khóa tìm kiếm
        statusFilter = "All", // Bộ lọc trạng thái
        nameOrCodeFilter = "", // Bộ lọc tên/mã
        useClientFilter = false, // Có sử dụng filter ở client không
        customPageSize = pageSize // Số phần tử trên trang
    ) => {
        try {
            setLoading(true);
            setError(null);

            let response;
            if (keyword.trim()) {
                response = await warehouseService.searchWarehousesWithPagination(keyword, page, customPageSize);
            } else {
                response = await warehouseService.getWarehousesWithPagination(page, customPageSize);
            }

            let items = response.content || [];
            let total = response.totalElements || items.length;
            let pages = response.totalPages || Math.ceil(total / customPageSize);

            if (useClientFilter) {
                const q = (nameOrCodeFilter || "").trim().toLowerCase();

                if (q) {
                    items = items.filter((it) => {
                        const code = (it.code || "").toLowerCase();
                        const name = (it.name || "").toLowerCase();
                        return code.includes(q) || name.includes(q);
                    });
                }

                if (statusFilter && statusFilter !== "All") {
                    items = items.filter(
                        (it) => (it.status || "").toLowerCase() === statusFilter.toLowerCase()
                    );
                }

                total = items.length;
                pages = Math.ceil(total / customPageSize);
                items = items.slice(page * customPageSize, (page + 1) * customPageSize);
            }

            setWarehouses(items);
            setTotalPages(pages);
            setTotalElements(total);
            setCurrentPage(page);
        } catch (err) {
            console.error("Error fetching warehouses:", err);
            setError("Không thể tải danh sách kho");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        setCurrentPage(0);
        fetchWarehouses(0, searchKeyword, filterStatus, filterNameOrCode);
    }, [pageSize]);

    // Xử lý tìm kiếm
    const handleSearch = (e) => {
        e.preventDefault();

        fetchWarehouses(0, searchKeyword, "All", "", false);
        setFilterNameOrCode("");
        setFilterStatus("All");
    };

     // Xử lý đổi trang
    const handlePageChange = (newPage) => {
        const useClientFilter = Boolean(filterNameOrCode.trim() || (filterStatus && filterStatus !== "All"));
        fetchWarehouses(newPage, searchKeyword, filterStatus, filterNameOrCode, useClientFilter);
    };

    // Xử lý thay đổi số phần tử/trang
    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(0);
        const useClientFilter = Boolean(
            filterNameOrCode.trim() || (filterStatus && filterStatus !== "All")
        );
        fetchWarehouses(0, searchKeyword, filterStatus, filterNameOrCode, useClientFilter, newSize);
    };

    const openConfirm = (action, warehouseId) => {
        setConfirmState({
            open: true,
            action,
            warehouseId,
            message: action === "deactivate" ? "Ngừng hoạt động kho này?" : "Khôi phục kho này?",
        });
    };

    const closeConfirm = () => setConfirmState((s) => ({...s, open: false}));

    const showToast = (message, type = "success") => {
        setToast({open: true, message, type});
        setTimeout(() => setToast({open: false, message: "", type}), 2500);
    };

    const performConfirmedAction = async () => {
        const {action, warehouseId} = confirmState;
        if (!action || !warehouseId) return;
        try {
            if (action === "deactivate") {
                await warehouseService.deactivateWarehouse(warehouseId);
                showToast("Đã ngưng hoạt động kho", "success");
            } else if (action === "restore") {
                await warehouseService.restoreWarehouse(warehouseId);
                showToast("Đã khôi phục kho", "success");
            }

            const useClientFilter = Boolean(filterNameOrCode.trim() || (filterStatus && filterStatus !== "All"));
            fetchWarehouses(currentPage, searchKeyword, filterStatus, filterNameOrCode, useClientFilter);
        } catch (err) {
            showToast("Thao tác thất bại", "error");
        } finally {
            closeConfirm();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
    };


    const handleApplyFilters = () => {
        setCurrentPage(0);
        const useClientFilter = Boolean(filterNameOrCode.trim() || (filterStatus && filterStatus !== "All"));
        fetchWarehouses(0, searchKeyword, filterStatus, filterNameOrCode, useClientFilter);
    };

    const handleResetFilters = () => {
        setFilterNameOrCode("");
        setFilterStatus("All");
        setCurrentPage(0);
        fetchWarehouses(0, searchKeyword, "All", "", false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý kho hàng</h1>
                        <Link to="/warehouse/new"
                              className="bg-brand-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            Thêm kho
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Danh sách kho</h2>
                    </div>

                    {/* Confirm Modal */}
                    {confirmState.open && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/30" onClick={closeConfirm}></div>
                            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Xác nhận</h3>
                                </div>
                                <div className="px-6 py-5 text-gray-700">{confirmState.message}</div>
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                                    <button onClick={closeConfirm}
                                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                                        Hủy
                                    </button>
                                    <button onClick={performConfirmedAction}
                                            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800">
                                        Xác nhận
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toast */}
                    {toast.open && (
                        <div className="fixed top-6 right-6 z-[1000] animate-fade-in-down">
                            <div
                                className={`px-5 py-3 rounded-lg shadow-lg text-white font-medium ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
                                {toast.message}
                            </div>
                        </div>
                    )}

                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <form onSubmit={handleSearch} className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm kho..."
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none"
                                         stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                    </svg>
                                </div>
                                <button type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Tìm kiếm
                                </button>
                            </form>

                            <div className="flex items-center gap-4">
                                {/* Filters: name/code + status + apply/reset */}
                                <div className="flex items-center gap-2">
                                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="All">Tất cả trạng thái</option>
                                        <option value="Active">Hoạt động</option>
                                        <option value="Inactive">Không hoạt động</option>
                                    </select>
                                    <button onClick={handleApplyFilters}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Áp dụng
                                    </button>
                                    <button onClick={handleResetFilters}
                                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                        Reset
                                    </button>
                                </div>

                                <button
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"/>
                                    </svg>
                                    Bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600">Đang tải...</span>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-red-600">{error}</div>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MÃ
                                        KHO
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TÊN
                                        KHO
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ĐỊA
                                        CHỈ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TRẠNG
                                        THÁI
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NGÀY
                                        TẠO
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NGƯỜI
                                        TẠO
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HÀNH
                                        ĐỘNG
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {warehouses.map((w) => (
                                    <tr key={w.warehouseId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <Link to={`/warehouse/${w.warehouseId}`}
                                                  className="text-blue-600 hover:underline hover:text-blue-800 transition-colors">
                                                {w.code}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{w.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{w.location || ""}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs ${w.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {w.status === "Active" ? "Hoạt động" : w.status === "Inactive" ? "Không hoạt động" : w.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(w.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{w.createdBy?.username || w.createdBy?.email || ""}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-1">
                                                <Link to={`/warehouse/${w.warehouseId}`} title="Xem chi tiết"
                                                      className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300">
                                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                <Link to={`/warehouse/${w.warehouseId}/edit`} title="Chỉnh sửa"
                                                      className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300">
                                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                {w.status === "Active" ? (
                                                    <button onClick={() => openConfirm("deactivate", w.warehouseId)}
                                                            title="Vô hiệu hoá"
                                                            className="group p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-red-200 hover:border-red-300">
                                                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <button onClick={() => openConfirm("restore", w.warehouseId)}
                                                            title="Khôi phục"
                                                            className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300">
                                                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {!loading && !error && warehouses.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalElements={totalElements}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}