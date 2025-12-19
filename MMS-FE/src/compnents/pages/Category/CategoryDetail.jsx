import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faInfoCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getCategory } from '../../../api/categoryService';
import { toast } from 'react-toastify';

const CategoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setLoading(true);
                const data = await getCategory(id);
                setCategory(data);
            } catch (error) {
                console.error('Lỗi khi tải danh mục:', error);
                toast.error('Không thể tải thông tin danh mục!');
                navigate('/categories');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCategory();
        }
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-500" />
            </div>
        );
    }

    if (!category) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/categories')}
                        className="px-3 py-1.5 rounded border hover:bg-gray-50"
                    >
                        ← Quay lại
                    </button>
                    <h1 className="text-2xl font-semibold">Chi tiết danh mục</h1>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">

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

            </div>
        </div>
    );
};

export default CategoryDetail;
