import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faInfoCircle, faSpinner, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { updateCategory } from '../../../api/categoryService';
import { validation } from '../../../utils/validation';
import { toast } from 'react-toastify';

const CategoryEdit = ({ category, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || ''
            });
        }
    }, [category]);

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
            const response = await updateCategory(category.categoryId, formData);
            toast.success('Cập nhật danh mục thành công!');
            onSave(response);
            onClose();
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

    if (!category) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 mx-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Chỉnh sửa danh mục</h2>
                            <p className="text-sm text-slate-600">Cập nhật thông tin danh mục: <span className="font-semibold text-green-700">{category.name}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-green-600" />
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
                            onClick={onClose}
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
