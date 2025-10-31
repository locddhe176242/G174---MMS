import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faTag, faCalendarAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const CategoryDetail = ({ category, onClose }) => {
    if (!category) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 mx-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FontAwesomeIcon icon={faTag} className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Chi tiết danh mục</h2>
                            <p className="text-sm text-slate-600">Thông tin chi tiết về danh mục sản phẩm</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-blue-600" />
                            <h3 className="text-base font-semibold text-slate-800">Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ID Danh mục</label>
                                <p className="text-slate-800 font-mono">#{category.categoryId}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    category.deletedAt 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {category.deletedAt ? 'Đã xóa' : 'Hoạt động'}
                                </span>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục</label>
                                <p className="text-slate-800 font-semibold">{category.name}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                                <p className="text-slate-800">{category.description || 'Không có mô tả'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 text-blue-600" />
                            <h3 className="text-base font-semibold text-slate-800">Thông tin thời gian</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày tạo</label>
                                <p className="text-slate-800">
                                    {category.createdAt ? (
                                        <div>
                                            <div className="font-medium">
                                                {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(category.createdAt).toLocaleTimeString('vi-VN')}
                                            </div>
                                        </div>
                                    ) : (
                                        'Không có thông tin'
                                    )}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cập nhật lần cuối</label>
                                <p className="text-slate-800">
                                    {category.updatedAt ? (
                                        <div>
                                            <div className="font-medium">
                                                {new Date(category.updatedAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(category.updatedAt).toLocaleTimeString('vi-VN')}
                                            </div>
                                        </div>
                                    ) : (
                                        'Chưa cập nhật'
                                    )}
                                </p>
                            </div>
                        </div>

                        {category.deletedAt && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-red-700 mb-1">Ngày xóa</label>
                                <p className="text-red-700">
                                    <div className="font-medium">
                                        {new Date(category.deletedAt).toLocaleDateString('vi-VN')}
                                    </div>
                                    <div className="text-xs text-red-500">
                                        {new Date(category.deletedAt).toLocaleTimeString('vi-VN')}
                                    </div>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="group px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:scale-105 hover:shadow-sm"
                    >
                        <span className="group-hover:font-medium transition-all duration-200">Đóng</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryDetail;
