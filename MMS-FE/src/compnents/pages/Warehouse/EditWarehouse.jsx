import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { warehouseService } from "../../../api/warehouseService.js";
import useAuthStore from "../../../store/authStore";

export default function EditWarehouse() {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user } = useAuthStore();

	const [form, setForm] = useState({
		code: "",
		name: "",
		location: "",
		status: "Active",
	});
	const [meta, setMeta] = useState({ createdBy: "", createdAt: "" });
	const [loading, setLoading] = useState(true);
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);

	// Confirm & Toast
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [toast, setToast] = useState({ open: false, message: "", type: "success" });

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const data = await warehouseService.getWarehouseById(id);
				setForm({
					code: data.code || "",
					name: data.name || "",
					location: data.location || "",
					status: data.status || "Active",
				});
				setMeta({
					createdBy: data.createdBy?.email || "",
					createdAt: data.createdAt || "",
				});
			} catch (e) {
				alert("Không tìm thấy kho");
				navigate("/warehouse");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [id, navigate]);

	const validate = () => {
		const newErrors = {};
		if (!form.code.trim()) newErrors.code = "Bắt buộc";
		if (!form.name.trim()) newErrors.name = "Bắt buộc";
		if (form.code.length > 50) newErrors.code = "Tối đa 50 ký tự";
		if (form.name.length > 100) newErrors.name = "Tối đa 100 ký tự";
		if (form.location && form.location.length > 255) newErrors.location = "Tối đa 255 ký tự";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;
		setConfirmOpen(true);
	};

	const showToast = (message, type = "success") => {
		setToast({ open: true, message, type });
		setTimeout(() => setToast({ open: false, message: "", type }), 2500);
	};

	const confirmSave = async () => {
		try {
			setSubmitting(true);
			await warehouseService.updateWarehouse(id, form, user?.userId ?? undefined);
			showToast("Cập nhật kho thành công", "success");
			setTimeout(() => navigate("/warehouse"), 2500);
		} catch (err) {
			showToast("Không thể cập nhật kho", "error");
		} finally {
			setSubmitting(false);
			setConfirmOpen(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-gray-600">Đang tải...</span>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-white shadow-sm">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold text-gray-900">Cập nhật kho</h1>
						<Link to="/warehouse" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Trở về danh sách</Link>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6">
				<div className="bg-white rounded-lg shadow-sm">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900">Thông tin kho</h2>
					</div>
					<form onSubmit={handleSubmit} className="p-6 space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-700">Mã kho<span className="text-red-500"> *</span></label>
								<input name="code" value={form.code} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
								{errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Tên kho<span className="text-red-500"> *</span></label>
								<input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
								{errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
								<input name="location" value={form.location} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
								{errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Trạng thái</label>
								<select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
									<option value="Active">Active</option>
									<option value="Inactive">Inactive</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Người tạo</label>
								<input disabled value={meta.createdBy} className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-700" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
								<input disabled value={meta.createdAt ? new Date(meta.createdAt).toLocaleDateString("vi-VN") : ""} className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-700" />
							</div>
						</div>

						<div className="pt-4 flex items-center gap-3">
							<button type="submit" disabled={submitting} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">{submitting ? "Đang lưu..." : "Lưu thay đổi"}</button>
							<Link to="/warehouse" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Huỷ</Link>
						</div>
					</form>
				</div>
			</div>

			{/* Confirm Modal */}
			{confirmOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/30" onClick={() => setConfirmOpen(false)}></div>
					<div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
						<div className="px-6 py-4 border-b border-gray-200">
							<h3 className="text-lg font-semibold text-gray-900">Xác nhận</h3>
						</div>
						<div className="px-6 py-5 text-gray-700">Bạn có chắc muốn lưu thay đổi?</div>
						<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
							<button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Hủy</button>
							<button onClick={confirmSave} className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800">Xác nhận</button>
						</div>
					</div>
				</div>
			)}

			{/* Toast */}
			{toast.open && (
				<div className="fixed top-6 right-6 z-[1000] animate-fade-in-down">
					<div
						className={`px-5 py-3 rounded-lg shadow-lg text-white font-medium ${
							toast.type === "success" ? "bg-green-600" : "bg-red-600"
						}`}
					>
						{toast.message}
					</div>
				</div>
			)}
		</div>
	);
}


