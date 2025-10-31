import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { createCategory } from '../../../api/categoryService';
import { validation } from '../../../utils/validation';
import { toast } from 'react-toastify';

const CategoryAdd = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const response = await createCategory(formData);
            toast.success('Thêm danh mục thành công!');
            onSave(response);
            onClose();
        } catch (error) {
            console.error('Lỗi khi tạo danh mục:', error);
            const apiMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'Tạo danh mục thất bại, vui lòng thử lại!';
            toast.error(`${apiMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                            <FontAwesomeIcon icon={faPlus} className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                Thêm danh mục
                            </h2>
                            <p className="text-sm text-gray-600 mt-0.5">Tạo danh mục mới trong hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 group"
                    >
                        <FontAwesomeIcon icon={faX} className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:rotate-90 transition-all duration-200" />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto px-8 py-6" style={{ 
                    maxHeight: 'calc(90vh - 180px)',
                    WebkitOverflowScrolling: 'touch',
                    transform: 'translateZ(0)',
                    scrollBehavior: 'smooth',
                }}>
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200/50">
                            <div className="flex items-center gap-2 mb-5">
                                <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-semibold text-gray-800">Thông tin danh mục</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên danh mục <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm transition-all duration-200 ${
                                            validationErrors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Nhập tên danh mục (tối đa 100 ký tự)"
                                        required
                                    />
                                    {validationErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        {formData.name.length}/100 ký tự
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="4"
                                        className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm resize-none transition-all duration-200 ${
                                            validationErrors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Nhập mô tả danh mục (tối đa 500 ký tự)"
                                    />
                                    {validationErrors.description && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        {formData.description.length}/500 ký tự
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-xl p-4 border border-amber-200/50">
                            <h4 className="text-sm font-semibold text-amber-800 mb-2">Quy tắc đặt tên:</h4>
                            <ul className="text-xs text-amber-700 space-y-1">
                                <li>• Chỉ được chứa chữ cái, số, khoảng trắng, dấu gạch ngang</li>
                                <li>• Tên danh mục phải là duy nhất</li>
                                <li>• Không được để trống</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                        {isSubmitting ? 'Đang tạo...' : 'Thêm danh mục'}
                    </button>
                </div>
            </form>

            <style jsx>{`
                /* Custom Scrollbar */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 8px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #3b82f6, #6366f1);
                    border-radius: 10px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #2563eb, #4f46e5);
                }
            `}</style>
        </div>
    );
};

export default CategoryAdd;
