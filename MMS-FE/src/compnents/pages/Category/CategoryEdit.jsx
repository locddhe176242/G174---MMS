import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faFloppyDisk, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getCategory, updateCategory } from '../../../api/categoryService';
import { validation } from '../../../utils/validation';
import { toast } from 'react-toastify';

const CategoryEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setLoading(true);
                const data = await getCategory(id);
                setCategory(data);
                setFormData({
                    name: data.name || '',
                    description: data.description || ''
                });
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        const nameValidation = validation.categoryName.validate(formData.name);
        if (!nameValidation.isValid) {
            errors.name = nameValidation.message;
        }

        const descriptionValidation = validation.categoryDescription.validate(formData.description);
        if (!descriptionValidation.isValid) {
            errors.description = descriptionValidation.message;
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await updateCategory(id, formData);
            toast.success('Cập nhật danh mục thành công!');
            navigate('/categories');
        } catch (error) {
            console.error('Lỗi khi cập nhật danh mục:', error);
            const apiMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'Cập nhật danh mục thất bại, vui lòng thử lại!';
            toast.error(apiMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        title="Quay lại trang trước"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <h1 className="text-2xl font-semibold">Chỉnh sửa danh mục</h1>
                </div>
                <p className="text-sm text-slate-600 mt-2">Cập nhật thông tin danh mục: <span className="font-semibold text-green-700">{category.name}</span></p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="mb-4">
                                <h3 className="text-base font-semibold text-slate-800">Thông tin danh mục</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tên danh mục <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                            validationErrors.name ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                        placeholder="Nhập tên danh mục (tối đa 100 ký tự)"
                                        required
                                    />
                                    {validationErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                                    )}
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formData.name.length}/100 ký tự
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${
                                            validationErrors.description ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                        placeholder="Nhập mô tả danh mục (tối đa 500 ký tự)"
                                    />
                                    {validationErrors.description && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                                    )}
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formData.description.length}/500 ký tự
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-slate-800 mb-3">Thông tin hiện tại:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-600 font-medium">ID:</span>
                                    <span className="ml-2 text-slate-800 font-mono">#{category.categoryId}</span>
                                </div>
                                <div>
                                    <span className="text-slate-600 font-medium">Ngày tạo:</span>
                                    <span className="ml-2 text-slate-800">
                                        {category.createdAt ? new Date(category.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-600 font-medium">Cập nhật lần cuối:</span>
                                    <span className="ml-2 text-slate-800">
                                        {category.updatedAt ? new Date(category.updatedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg border border-green-600 hover:border-green-700 disabled:hover:scale-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                                    <span>Đang cập nhật...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                    <span className="group-hover:font-medium transition-all duration-200">Cập nhật danh mục</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/categories')}
                            disabled={isSubmitting}
                            className="group px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-sm disabled:hover:scale-100"
                        >
                            <span className="group-hover:font-medium transition-all duration-200">Hủy</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryEdit;
