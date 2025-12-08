import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import purchaseRequisitionService from "../../../api/purchaseRequisitionService";
import purchaseQuotationService from "../../../api/purchaseQuotationService";
import purchaseOrderService from "../../../api/purchaseOrderService";
import salesQuotationService from "../../../api/salesQuotationService";
import salesOrderService from "../../../api/salesOrderService";
import apInvoiceService from "../../../api/apInvoiceService";
import invoiceService from "../../../api/invoiceService";
import apiClient from "../../../api/apiClient";
import { getCurrentUser } from "../../../api/authService";

export default function ApprovalList() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterType, setFilterType] = useState("all"); // all, purchase, sales
  
  // State cho modal approve/reject
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Helper function để tránh nested ternary
  const getPaginationButtonClass = (isActive) => {
    if (isActive) {
      return "px-3 py-1 border rounded-md bg-black text-white border-black";
    }
    return "px-3 py-1 border rounded-md border-gray-300 hover:bg-gray-50";
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    if (sortDirection === "asc") {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
        </svg>
      );
    }
  };

  // Fetch all pending documents from both Purchase and Sales
  const fetchDocuments = async (page = 0, keyword = "", sortField = "createdAt", sortDirection = "desc", type = "all") => {
    try {
      setLoading(true);
      setError(null);

      const sort = `${sortField},${sortDirection}`;
      const allDocuments = [];
      
      console.log('=== Starting fetchDocuments ===');
      console.log('Type filter:', type);

      // Fetch Purchase Requisitions (Pending)
      if (type === "all" || type === "purchase") {
        try {
          console.log('Fetching Purchase Requisitions...');
          let prResponse = await purchaseRequisitionService.getRequisitionsWithPagination(0, 100, sort, "Pending");
          console.log('PR Raw Response:', prResponse);
          
          // Extract data if wrapped
          let prData = prResponse;
          if (prData && typeof prData === 'object' && 'data' in prData) {
            prData = prData.data;
          }
          
          console.log('PR Data after extract:', prData);
          
          if (prData && prData.content && Array.isArray(prData.content)) {
            console.log('PR Count:', prData.content.length);
            prData.content.forEach(item => {
              const docId = item.requisitionId || item.requisition_id || item.id;
              if (docId) {
                allDocuments.push({
                  ...item,
                  documentType: "Purchase Requisition",
                  documentTypeCode: "PR",
                  id: docId,
                  number: item.requisitionNo || item.requisition_no || item.number,
                  createdDate: item.createdAt || item.created_at || item.createdDate,
                  requesterName: item.requesterName || item.requester_name || item.requester,
                  totalAmount: item.totalValue || item.total_value || item.totalAmount || 0,
                });
              }
            });
          } else {
            console.log('PR Data structure unexpected:', prData);
          }
        } catch (err) {
          console.error("Error fetching purchase requisitions:", err);
          console.error("Error details:", err.response?.data);
        }
      }

      // Fetch Purchase Quotations (Pending)
      if (type === "all" || type === "purchase") {
        try {
          console.log('Fetching Purchase Quotations...');
          const pqData = await purchaseQuotationService.getQuotationsWithPagination(0, 100, sort);
          console.log('PQ Data:', pqData);
          if (pqData && pqData.content && Array.isArray(pqData.content)) {
            console.log('PQ Total Count:', pqData.content.length);
            const pendingPQs = pqData.content.filter(item => item.status === "Pending");
            console.log('PQ Pending Count:', pendingPQs.length);
            console.log('Pending PQs:', pendingPQs);
            
            // Fetch details for each PQ to get complete information
            for (const item of pendingPQs) {
              console.log('PQ item:', item);
              console.log('PQ item keys:', Object.keys(item));
              const docId = item.pqId || item.quotationId || item.quotation_id || item.id;
              console.log('Processing PQ with ID:', docId);
              if (docId) {
                try {
                  console.log(`Fetching PQ detail for ${docId}...`);
                  // Fetch full PQ detail
                  const response = await apiClient.get(`/purchase-quotations/${docId}`);
                  console.log(`PQ ${docId} response:`, response);
                  
                  // Extract the actual data
                  let pqDetail = response.data;
                  if (pqDetail && typeof pqDetail === 'object' && 'data' in pqDetail) {
                    pqDetail = pqDetail.data;
                  }
                  
                  // Try to get totalAmount from various fields
                  let totalAmount = pqDetail?.totalAfterTax || pqDetail?.total_after_tax ||
                                   pqDetail?.totalAmount || pqDetail?.total_amount || 
                                   pqDetail?.grandTotal || pqDetail?.grand_total ||
                                   pqDetail?.finalAmount || pqDetail?.final_amount || 0;
                  
                  // If still 0, calculate from items
                  if (totalAmount === 0 && pqDetail?.items && Array.isArray(pqDetail.items)) {
                    totalAmount = pqDetail.items.reduce((sum, lineItem) => {
                      const lineTotal = lineItem.lineTotal || lineItem.line_total || 
                                       lineItem.totalPrice || lineItem.total_price ||
                                       lineItem.total || lineItem.amount || 
                                       (lineItem.quantity && lineItem.unitPrice ? lineItem.quantity * lineItem.unitPrice : 0) ||
                                       (lineItem.quantity && lineItem.unit_price ? lineItem.quantity * lineItem.unit_price : 0) ||
                                       0;
                      return sum + Number(lineTotal);
                    }, 0);
                  }
                  
                  // Get RFQ information if exists
                  const rfqId = pqDetail?.rfqId || pqDetail?.rfq_id || pqDetail?.rfq?.rfqId || pqDetail?.rfq?.rfq_id;
                  const rfqNo = pqDetail?.rfqNo || pqDetail?.rfq_no || pqDetail?.rfq?.rfqNo || pqDetail?.rfq?.rfq_no;
                  
                  // If has RFQ, fetch other quotations for comparison
                  let compareQuotations = [];
                  if (rfqId) {
                    try {
                      const rfqQuotations = await purchaseQuotationService.getQuotationsByRfqId(rfqId);
                      if (rfqQuotations && Array.isArray(rfqQuotations)) {
                        compareQuotations = rfqQuotations
                          .filter(q => (q.quotationId || q.quotation_id || q.id) !== docId)
                          .map(q => ({
                            quotationId: q.quotationId || q.quotation_id || q.id,
                            quotationNo: q.quotationNo || q.quotation_no,
                            vendorName: q.vendorName || q.vendor_name,
                            totalAmount: q.totalAfterTax || q.total_after_tax || q.totalAmount || q.total_amount || 0,
                            status: q.status
                          }));
                      }
                    } catch (compareErr) {
                      console.error(`Error fetching compare quotations for RFQ ${rfqId}:`, compareErr);
                    }
                  }
                  
                  const pqDoc = {
                    ...pqDetail,
                    documentType: "Purchase Quotation",
                    documentTypeCode: "PQ",
                    id: docId,
                    number: pqDetail.quotationNo || pqDetail.quotation_no || item.quotationNo || item.quotation_no || item.number,
                    createdDate: pqDetail.createdAt || pqDetail.created_at || item.createdAt || item.created_at || item.createdDate,
                    requesterName: pqDetail.vendorName || pqDetail.vendor_name || item.vendorName || item.vendor_name || item.vendor,
                    totalAmount: totalAmount,
                    rfqId: rfqId,
                    rfqNo: rfqNo,
                    compareQuotations: compareQuotations,
                  };
                  console.log('Adding PQ document:', pqDoc);
                  allDocuments.push(pqDoc);
                  console.log('allDocuments after adding PQ:', allDocuments.length);
                } catch (detailErr) {
                  console.error(`Error fetching PQ detail for ${docId}:`, detailErr);
                  console.error('Error details:', detailErr.response?.data);
                  // Fallback to list data
                  const fallbackDoc = {
                    ...item,
                    documentType: "Purchase Quotation",
                    documentTypeCode: "PQ",
                    id: docId,
                    number: item.pqNo || item.quotationNo || item.quotation_no || item.number,
                    createdDate: item.pqDate || item.createdAt || item.created_at || item.createdDate,
                    requesterName: item.vendorName || item.vendor_name || item.vendor,
                    totalAmount: item.totalAmount || item.total_amount || 0,
                  };
                  console.log('Adding PQ fallback document:', fallbackDoc);
                  allDocuments.push(fallbackDoc);
                }
              } else {
                console.warn('PQ item has no valid ID:', item);
              }
            }
          }
        } catch (err) {
          console.error("Error fetching purchase quotations:", err);
        }
      }

      // Fetch Purchase Orders (Pending)
      if (type === "all" || type === "purchase") {
        try {
          console.log('Fetching Purchase Orders...');
          const poData = await purchaseOrderService.getPurchaseOrdersWithPagination(0, 100, sort);
          console.log('PO Data:', poData);
          if (poData && poData.content && Array.isArray(poData.content)) {
            console.log('PO Total Count:', poData.content.length);
            const pendingPOs = poData.content.filter(item => item.approvalStatus === "Pending" || item.approval_status === "Pending");
            console.log('PO Pending Count:', pendingPOs.length);
            
            // Fetch details for each PO to get totalAmount
            for (const item of pendingPOs) {
              const docId = item.orderId || item.order_id || item.id;
              if (docId) {
                try {
                  // Fetch full PO detail - call API directly to bypass extractData
                  const response = await apiClient.get(`/purchase-orders/${docId}`);
                  console.log('Raw API Response:', response);
                  console.log('Response data:', response.data);
                  
                  // Extract the actual data
                  let poDetail = response.data;
                  if (poDetail && typeof poDetail === 'object' && 'data' in poDetail) {
                    poDetail = poDetail.data;
                  }
                  
                  console.log('PO Detail after extract:', poDetail);
                  console.log('PO Detail keys:', poDetail ? Object.keys(poDetail) : 'null');
                  
                  // Try to get totalAmount from various fields
                  // Priority: total_after_tax (final total with tax), totalAmount, total_amount
                  let totalAmount = poDetail?.total_after_tax || poDetail?.totalAfterTax ||
                                   poDetail?.totalAmount || poDetail?.total_amount || 
                                   poDetail?.grandTotal || poDetail?.grand_total ||
                                   poDetail?.finalAmount || poDetail?.final_amount || 0;
                  
                  console.log('Total from fields:', totalAmount);
                  
                  // If still 0, calculate from items
                  if (totalAmount === 0 && poDetail?.items && Array.isArray(poDetail.items)) {
                    console.log('Calculating from items:', poDetail.items);
                    totalAmount = poDetail.items.reduce((sum, lineItem) => {
                      console.log('Line item:', lineItem);
                      console.log('Line item keys:', Object.keys(lineItem));
                      
                      const lineTotal = lineItem.lineTotal || lineItem.line_total || 
                                       lineItem.totalPrice || lineItem.total_price ||
                                       lineItem.total || lineItem.amount || 
                                       (lineItem.quantity && lineItem.unitPrice ? lineItem.quantity * lineItem.unitPrice : 0) ||
                                       (lineItem.quantity && lineItem.unit_price ? lineItem.quantity * lineItem.unit_price : 0) ||
                                       0;
                      console.log('Line total for this item:', lineTotal);
                      return sum + Number(lineTotal);
                    }, 0);
                    console.log('Calculated total:', totalAmount);
                  }
                  
                  allDocuments.push({
                    ...item,
                    documentType: "Purchase Order",
                    documentTypeCode: "PO",
                    id: docId,
                    number: item.orderNo || item.order_no || item.number,
                    createdDate: item.createdAt || item.created_at || item.createdDate,
                    requesterName: item.vendorName || item.vendor_name || item.vendor,
                    totalAmount: totalAmount,
                  });
                } catch (detailErr) {
                  console.error(`Error fetching PO detail for ${docId}:`, detailErr);
                  // Fallback to list data
                  allDocuments.push({
                    ...item,
                    documentType: "Purchase Order",
                    documentTypeCode: "PO",
                    id: docId,
                    number: item.orderNo || item.order_no || item.number,
                    createdDate: item.createdAt || item.created_at || item.createdDate,
                    requesterName: item.vendorName || item.vendor_name || item.vendor,
                    totalAmount: 0,
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error("Error fetching purchase orders:", err);
        }
      }

      // Fetch Sales Quotations (Pending)
      if (type === "all" || type === "sales") {
        try {
          const sqData = await salesQuotationService.getAllQuotations({ status: "Pending" });
          if (Array.isArray(sqData)) {
            sqData.forEach(item => {
              const docId = item.quotationId || item.quotation_id || item.id;
              if (docId) {
                allDocuments.push({
                  ...item,
                  documentType: "Sales Quotation",
                  documentTypeCode: "SQ",
                  id: docId,
                  number: item.quotationNo || item.quotation_no || item.number,
                  createdDate: item.createdAt || item.created_at || item.createdDate,
                  requesterName: item.customerName || item.customer_name || item.customer,
                  totalAmount: item.totalAmount || item.total_amount || 0,
                });
              }
            });
          }
        } catch (err) {
          console.error("Error fetching sales quotations:", err);
        }
      }

      // Fetch Sales Orders (Pending approval)
      if (type === "all" || type === "sales") {
        try {
          const soData = await salesOrderService.getAllOrders({ approvalStatus: "Pending" });
          if (Array.isArray(soData)) {
            soData.forEach(item => {
              const docId = item.orderId || item.order_id || item.id;
              if (docId) {
                allDocuments.push({
                  ...item,
                  documentType: "Sales Order",
                  documentTypeCode: "SO",
                  id: docId,
                  number: item.orderNo || item.order_no || item.number,
                  createdDate: item.createdAt || item.created_at || item.createdDate,
                  requesterName: item.customerName || item.customer_name || item.customer,
                  totalAmount: item.totalAmount || item.total_amount || 0,
                });
              }
            });
          }
        } catch (err) {
          console.error("Error fetching sales orders:", err);
        }
      }

      // Note: AP/AR Invoices are handled by Accounting department, not in this approval workflow

      console.log('=== Total documents collected:', allDocuments.length);
      console.log('All documents:', allDocuments);

      // Filter by keyword if provided
      let filteredDocuments = allDocuments;
      if (keyword.trim()) {
        const lowerKeyword = keyword.toLowerCase();
        filteredDocuments = allDocuments.filter(doc => 
          doc.number?.toLowerCase().includes(lowerKeyword) ||
          doc.requesterName?.toLowerCase().includes(lowerKeyword) ||
          doc.documentType?.toLowerCase().includes(lowerKeyword)
        );
      }

      console.log('Filtered documents:', filteredDocuments.length);

      // Sort documents
      filteredDocuments.sort((a, b) => {
        const aValue = a[sortField] || a.createdDate;
        const bValue = b[sortField] || b.createdDate;
        
        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Pagination
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

      console.log('Paginated documents:', paginatedDocuments);
      console.log('=== FINAL RESULT ===');
      console.log('Total documents to display:', paginatedDocuments.length);
      console.log('Documents array:', paginatedDocuments);

      setDocuments(paginatedDocuments);
      setTotalElements(filteredDocuments.length);
      setTotalPages(Math.ceil(filteredDocuments.length / pageSize));
      setCurrentPage(page);
      
      console.log('State updated - documents.length:', paginatedDocuments.length);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Không thể tải danh sách đơn cần duyệt: " + (err.message || ""));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(currentPage, searchKeyword, sortField, sortDirection, filterType);
  }, [currentPage, sortField, sortDirection, filterType]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchDocuments(0, searchKeyword, sortField, sortDirection, filterType);
  };

  // Handle approve
  const handleApprove = async () => {
    if (!selectedDocument) return;

    try {
      setIsProcessing(true);
      
      // Get current user ID
      const currentUser = getCurrentUser();
      const approverId = currentUser?.userId || currentUser?.id;
      
      if (!approverId) {
        toast.error("Không tìm thấy thông tin người duyệt");
        return;
      }
      
      // Approve based on document type
      switch (selectedDocument.documentTypeCode) {
        case "PR":
          await purchaseRequisitionService.approveRequisition(selectedDocument.id);
          break;
        case "PQ":
          await purchaseQuotationService.approveQuotation(selectedDocument.id, approverId);
          break;
        case "PO":
          await purchaseOrderService.approvePurchaseOrder(selectedDocument.id, approverId);
          break;
        case "API":
          await apInvoiceService.approveInvoice(selectedDocument.id, approverId);
          break;
        case "SQ":
          await salesQuotationService.changeStatus(selectedDocument.id, "Approved");
          break;
        case "SO":
          await salesOrderService.changeApprovalStatus(selectedDocument.id, "Approved");
          break;
        case "ARI":
          await invoiceService.approveInvoice(selectedDocument.id, approverId);
          break;
        default:
          throw new Error("Unknown document type");
      }

      toast.success("Đã duyệt đơn thành công!");
      setShowApproveModal(false);
      setSelectedDocument(null);
      fetchDocuments(currentPage, searchKeyword, sortField, sortDirection, filterType);
    } catch (err) {
      console.error("Error approving document:", err);
      toast.error("Không thể duyệt đơn: " + (err.response?.data?.message || err.message || "Vui lòng thử lại"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedDocument) return;

    if (!rejectReason.trim()) {
      toast.warn("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Get current user ID
      const currentUser = getCurrentUser();
      const approverId = currentUser?.userId || currentUser?.id;
      
      if (!approverId) {
        toast.error("Không tìm thấy thông tin người duyệt");
        return;
      }
      
      // Reject based on document type
      switch (selectedDocument.documentTypeCode) {
        case "PR":
          await purchaseRequisitionService.rejectRequisition(selectedDocument.id, rejectReason);
          break;
        case "PQ":
          await purchaseQuotationService.rejectQuotation(selectedDocument.id, approverId, rejectReason);
          break;
        case "PO":
          await purchaseOrderService.rejectPurchaseOrder(selectedDocument.id, approverId, rejectReason);
          break;
        case "API":
          await apInvoiceService.rejectInvoice(selectedDocument.id, approverId, rejectReason);
          break;
        case "SQ":
          await salesQuotationService.changeStatus(selectedDocument.id, "Rejected");
          break;
        case "SO":
          await salesOrderService.changeApprovalStatus(selectedDocument.id, "Rejected");
          break;
        case "ARI":
          await invoiceService.rejectInvoice(selectedDocument.id, approverId, rejectReason);
          break;
        default:
          throw new Error("Unknown document type");
      }

      toast.success("Đã từ chối đơn thành công!");
      setShowRejectModal(false);
      setSelectedDocument(null);
      setRejectReason("");
      fetchDocuments(currentPage, searchKeyword, sortField, sortDirection, filterType);
    } catch (err) {
      console.error("Error rejecting document:", err);
      toast.error("Không thể từ chối đơn: " + (err.response?.data?.message || err.message || "Vui lòng thử lại"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Open approve modal
  const openApproveModal = (document) => {
    setSelectedDocument(document);
    setShowApproveModal(true);
  };

  // Open reject modal
  const openRejectModal = (document) => {
    setSelectedDocument(document);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Get document route based on type
  const getDocumentRoute = (doc) => {
    if (!doc.id) {
      console.error("Document ID is missing:", doc);
      toast.error("Không thể xem chi tiết: ID không hợp lệ");
      return "#";
    }
    
    switch (doc.documentTypeCode) {
      case "PR": return `/purchase/purchase-requisitions/${doc.id}`;
      case "PQ": return `/purchase/purchase-quotations/${doc.id}`;
      case "PO": return `/purchase/purchase-orders/${doc.id}`;
      case "API": return `/purchase/ap-invoices/${doc.id}`;
      case "SQ": return `/sales/quotations/${doc.id}`;
      case "SO": return `/sales/orders/${doc.id}`;
      case "ARI": return `/sales/invoices/${doc.id}`;
      default: return "#";
    }
  };
  
  // Handle view document
  const handleViewDocument = (doc) => {
    const route = getDocumentRoute(doc);
    if (route !== "#") {
      navigate(route);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      Draft: { label: "Nháp", color: "bg-gray-100 text-gray-800" },
      Pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
      Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800" },
      Rejected: { label: "Từ chối", color: "bg-red-100 text-red-800" },
    };
    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Duyệt đơn yêu cầu</h1>
            <button
              onClick={() => navigate("/purchase-requisitions")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filter and Search bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType("purchase")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "purchase"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mua hàng
            </button>
            <button
              onClick={() => setFilterType("sales")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "sales"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bán hàng
            </button>
          </div>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm theo số đơn, người yêu cầu, loại đơn..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                setCurrentPage(0);
                fetchDocuments(0, "", sortField, sortDirection, filterType);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Làm mới
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại đơn
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("number")}>
                        <div className="flex items-center gap-2">
                          Số đơn
                          {getSortIcon("number")}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người yêu cầu/Đối tác
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("createdDate")}>
                        <div className="flex items-center gap-2">
                          Ngày tạo
                          {getSortIcon("createdDate")}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng giá trị
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          Không có đơn nào cần duyệt
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => (
                        <tr key={`${doc.documentTypeCode}-${doc.id}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              doc.documentTypeCode.startsWith("P") 
                                ? "bg-purple-100 text-purple-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {doc.documentType}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {doc.number || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {doc.requesterName || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(doc.createdDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {formatCurrency(doc.totalAmount || 0)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDocument(doc)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Xem chi tiết"
                              >
                                Xem
                              </button>
                              {/* For PQ with RFQ, show Compare button to select best vendor */}
                              {doc.documentTypeCode === "PQ" && doc.rfqId ? (
                                <button
                                  onClick={() => navigate(`/purchase/rfqs/${doc.rfqId}/compare-quotations`)}
                                  className="px-3 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded border border-purple-200"
                                  title="So sánh và chọn báo giá tốt nhất"
                                >
                                  So sánh báo giá
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => openApproveModal(doc)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Duyệt đơn"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(doc)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Từ chối đơn"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} đơn
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(0)}
                        disabled={currentPage === 0}
                        className={getPaginationButtonClass(false)}
                      >
                        Đầu
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className={getPaginationButtonClass(false)}
                      >
                        Trước
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (currentPage < 3) {
                          pageNum = i;
                        } else if (currentPage > totalPages - 4) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={getPaginationButtonClass(pageNum === currentPage)}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className={getPaginationButtonClass(false)}
                      >
                        Sau
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1}
                        className={getPaginationButtonClass(false)}
                      >
                        Cuối
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận duyệt đơn</h3>
              <p className="text-sm text-gray-600 mb-2">
                Bạn có chắc chắn muốn duyệt đơn:
              </p>
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-sm"><strong>Loại:</strong> {selectedDocument?.documentType}</p>
                <p className="text-sm"><strong>Số:</strong> {selectedDocument?.number}</p>
                <p className="text-sm"><strong>Giá trị:</strong> {formatCurrency(selectedDocument?.totalAmount || 0)}</p>
                {selectedDocument?.requesterName && (
                  <p className="text-sm"><strong>Nhà cung cấp:</strong> {selectedDocument.requesterName}</p>
                )}
              </div>

              {/* RFQ Comparison for Purchase Quotation */}
              {selectedDocument?.documentTypeCode === "PQ" && selectedDocument?.rfqId && (
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      📋 Yêu cầu báo giá: <span className="font-semibold">{selectedDocument.rfqNo}</span>
                    </p>
                    <p className="text-xs text-blue-700">
                      Báo giá này thuộc yêu cầu báo giá {selectedDocument.rfqNo}
                    </p>
                  </div>

                  {selectedDocument?.compareQuotations && selectedDocument.compareQuotations.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        💰 So sánh với các báo giá khác ({selectedDocument.compareQuotations.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedDocument.compareQuotations.map((quote, idx) => (
                          <div 
                            key={quote.quotationId} 
                            className="bg-gray-50 rounded p-2 flex justify-between items-center text-xs"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{quote.quotationNo}</p>
                              <p className="text-gray-600">{quote.vendorName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(quote.totalAmount || 0)}
                              </p>
                              <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                quote.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                quote.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {quote.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ℹ️ Xem xét so sánh giá trước khi phê duyệt
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedDocument(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  Hủy
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận duyệt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Từ chối đơn</h3>
              <p className="text-sm text-gray-600 mb-2">
                Bạn có chắc chắn muốn từ chối đơn:
              </p>
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-sm"><strong>Loại:</strong> {selectedDocument?.documentType}</p>
                <p className="text-sm"><strong>Số:</strong> {selectedDocument?.number}</p>
                <p className="text-sm"><strong>Giá trị:</strong> {formatCurrency(selectedDocument?.totalAmount || 0)}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedDocument(null);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

