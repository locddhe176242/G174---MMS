import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { invoiceService } from "../../../../api/invoiceService";
import html2pdf from "html2pdf.js";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `Ngày ${day} tháng ${month} năm ${year}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const formatNumber = (value) => (value ? Number(value).toLocaleString("vi-VN") : "0");

// Hàm chuyển số thành chữ tiếng Việt
const numberToWords = (num) => {
  const ones = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  const hundreds = ["", "một trăm", "hai trăm", "ba trăm", "bốn trăm", "năm trăm", "sáu trăm", "bảy trăm", "tám trăm", "chín trăm"];

  if (num === 0) return "không";
  if (num < 10) return ones[num];
  if (num < 20) {
    if (num === 10) return "mười";
    return "mười " + ones[num % 10];
  }
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    if (one === 0) return tens[ten];
    if (one === 1) return tens[ten] + " mốt";
    if (one === 5) return tens[ten] + " lăm";
    return tens[ten] + " " + ones[one];
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    if (remainder === 0) return hundreds[hundred];
    return hundreds[hundred] + " " + numberToWords(remainder);
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    if (remainder === 0) return numberToWords(thousand) + " nghìn";
    return numberToWords(thousand) + " nghìn " + numberToWords(remainder);
  }
  if (num < 1000000000) {
    const million = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    if (remainder === 0) return numberToWords(million) + " triệu";
    return numberToWords(million) + " triệu " + numberToWords(remainder);
  }
  const billion = Math.floor(num / 1000000000);
  const remainder = num % 1000000000;
  if (remainder === 0) return numberToWords(billion) + " tỷ";
  return numberToWords(billion) + " tỷ " + numberToWords(remainder);
};

const convertNumberToVietnamese = (num) => {
  const numStr = Math.floor(num).toString();
  const parts = [];
  for (let i = numStr.length; i > 0; i -= 3) {
    parts.unshift(numStr.slice(Math.max(0, i - 3), i));
  }
  
  const units = ["", "nghìn", "triệu", "tỷ"];
  let result = "";
  
  for (let i = 0; i < parts.length; i++) {
    const part = parseInt(parts[i]);
    if (part > 0) {
      const unitIndex = parts.length - 1 - i;
      if (result) result += " ";
      result += numberToWords(part);
      if (unitIndex > 0 && units[unitIndex]) {
        result += " " + units[unitIndex];
      }
    }
  }
  
  return result.charAt(0).toUpperCase() + result.slice(1) + " đồng chẵn.";
};

export default function InvoicePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await invoiceService.getInvoiceById(id);
        setData(response);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải hóa đơn");
        navigate("/sales/invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, navigate]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      toast.error("Không thể tải PDF");
      return;
    }

    try {
      setDownloading(true);
      const element = invoiceRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Hoa_don_${data.invoiceNo || id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("Đã tải PDF thành công");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Không thể tải PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải hóa đơn...</p>
      </div>
    );
  }

  const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
  const day = String(invoiceDate.getDate()).padStart(2, "0");
  const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");
  const year = invoiceDate.getFullYear();

  return (
    <>
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            page-break-after: auto;
            page-break-inside: avoid;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 20px auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border: 2px solid #0066cc;
          }
        }
      `}</style>
      <div className="no-print" style={{ padding: "20px", textAlign: "center" }}>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4"
        >
          🖨️ In hóa đơn
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-4 disabled:opacity-50"
        >
          {downloading ? "Đang tải..." : "Tải PDF"}
        </button>
        <button
          onClick={() => navigate(`/sales/invoices/${id}`)}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Quay lại
        </button>
      </div>
      <div 
        ref={invoiceRef}
        className="print-container print-page" 
        style={{ border: "2px solid #0066cc", padding: "20px", fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div style={{ marginBottom: "20px", borderBottom: "2px solid #0066cc", paddingBottom: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            {/* Logo và tên công ty - bên trái */}
            <div style={{ flex: "1" }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#0066cc", marginBottom: "5px" }}>
                CÔNG TY TNHH SENBOT VIỆT NAM
              </div>
            </div>
            
            {/* Tiêu đề và thông tin hóa đơn - bên phải */}
            <div style={{ flex: "2", textAlign: "center" }}>
              <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#0066cc", margin: "0 0 10px 0" }}>
                HÓA ĐƠN BÁN HÀNG
              </h1>
              <p style={{ margin: "5px 0", fontSize: "12px" }}>
                {formatDate(data.invoiceDate)}
              </p>
            </div>
            
            {/* Mẫu số và số hóa đơn - bên phải */}
            <div style={{ flex: "1", textAlign: "right" }}>
              <p style={{ margin: "3px 0", fontSize: "11px" }}>Mẫu số - Ký hiệu:</p>
              <p style={{ margin: "3px 0", fontSize: "11px", fontWeight: "bold" }}>01GTKT0/001</p>
              <p style={{ margin: "3px 0", fontSize: "11px" }}>Số:</p>
              <p style={{ margin: "3px 0", fontSize: "11px", fontWeight: "bold" }}>{data.invoiceNo || "—"}</p>
            </div>
          </div>
          
          {/* Mã cơ quan thuế */}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <p style={{ margin: "0", fontSize: "11px", color: "#666" }}>
              Mã của Cơ quan thuế: [Mã cơ quan thuế]
            </p>
          </div>
        </div>

        {/* Thông tin đơn vị bán */}
        <div style={{ marginBottom: "15px", border: "1px solid #ddd", padding: "10px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #ccc", paddingBottom: "5px" }}>
            Đơn vị bán hàng
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px" }}>
            <div>
              <p style={{ margin: "3px 0" }}><strong>Tên đơn vị:</strong> CÔNG TY TNHH SENBOT VIỆT NAM</p>
              <p style={{ margin: "3px 0" }}><strong>MST:</strong> 0110904093</p>
            </div>
            <div>
              <p style={{ margin: "3px 0" }}><strong>Địa chỉ:</strong> Số 2, ngõ 10 đường Nguyễn Văn Huyên, Phường Quan Hoa, Quận Cầu Giấy, Thành phố Hà Nội, Việt Nam</p>
              <p style={{ margin: "3px 0" }}><strong>STK:</strong> [Số tài khoản]</p>
            </div>
          </div>
        </div>

        {/* Thông tin người mua */}
        <div style={{ marginBottom: "15px", border: "1px solid #ddd", padding: "10px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #ccc", paddingBottom: "5px" }}>
            Người mua hàng
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px" }}>
            <div>
              <p style={{ margin: "3px 0" }}><strong>Tên đơn vị:</strong> {data.customerName || "—"}</p>
              <p style={{ margin: "3px 0" }}><strong>MST:</strong> {data.customerTaxCode || "[Mã số thuế]"}</p>
            </div>
            <div>
              <p style={{ margin: "3px 0" }}><strong>Địa chỉ:</strong> {data.customerAddress || "—"}</p>
              <p style={{ margin: "3px 0" }}><strong>HTTT:</strong> {data.paymentMethod || "Chuyển khoản"}</p>
              <p style={{ margin: "3px 0" }}><strong>STK:</strong> {data.customerAccountNo || "[Số tài khoản]"}</p>
            </div>
          </div>
        </div>

        {/* Bảng sản phẩm */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px", fontSize: "11px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5", border: "1px solid #000" }}>
              <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: "bold", width: "4%" }}>STT</th>
              <th style={{ border: "1px solid #000", padding: "8px", textAlign: "left", fontWeight: "bold", width: "30%" }}>Tên hàng hóa, dịch vụ</th>
              <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: "bold", width: "6%" }}>ĐVT</th>
              <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: "bold", width: "6%" }}>SL</th>
              <th style={{ border: "1px solid #000", padding: "8px", textAlign: "right", fontWeight: "bold", width: "10%" }}>Đơn giá</th>
              <th style={{ border: "1px solid #000", padding: "8px", textAlign: "right", fontWeight: "bold", width: "8%" }}>CK (%)</th>
              <th style={{ border: "1px solid #000", padding: "8px", textAlign: "right", fontWeight: "bold", width: "8%" }}>Thuế (%)</th>
              <th style={{ border: "1px solid #000", padding: "8px", textAlign: "right", fontWeight: "bold", width: "10%" }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item, index) => {
              const subtotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
              const taxAmount = Number(item.taxAmount || 0);
              const lineTotal = Number(item.lineTotal || 0);
              
              // Lấy discountPercent từ API response (đã được tính từ SalesOrderItem)
              let discountPercent = Number(item.discountPercent || item.discount_percent || 0);
              
              // Fallback: tính từ lineTotal nếu không có trong response
              if (discountPercent === 0 && subtotal > 0) {
                // lineTotal = subtotal - discountAmount + taxAmount
                // => discountAmount = subtotal + taxAmount - lineTotal
                const discountAmount = subtotal + taxAmount - lineTotal;
                if (discountAmount > 0) {
                  discountPercent = (discountAmount / subtotal) * 100;
                }
              }
              
              const discountAmount = subtotal * (discountPercent / 100);
              const afterDiscount = subtotal - discountAmount;
              
              return (
                <tr key={item.ariId || index} style={{ border: "1px solid #000" }}>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{index + 1}</td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    {item.productName || item.description || "—"}
                    {item.productSku && (
                      <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>Mã: {item.productSku}</div>
                    )}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                    {item.uom || "cái"}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                    {formatNumber(item.quantity || 0)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>
                    {formatNumber(item.unitPrice || 0)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>
                    {formatNumber(discountPercent)}%
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>
                    {formatNumber(item.taxRate || 0)}%
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                    {formatNumber(Math.round(lineTotal))}
                  </td>
                </tr>
              );
            })}
            {/* Thêm các dòng trống nếu cần */}
            {Array.from({ length: Math.max(0, 5 - (data.items?.length || 0)) }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ border: "1px solid #000", height: "40px" }}>
                <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "8px" }}></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tổng cộng */}
        <div style={{ marginBottom: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: "1", fontSize: "11px" }}>
              <p style={{ margin: "5px 0", fontWeight: "bold" }}>
                Số tiền viết bằng chữ: {convertNumberToVietnamese(data.totalAmount || 0)}
              </p>
            </div>
            <div style={{ width: "250px", fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #ddd" }}>
                <span>Tổng cộng tiền thanh toán:</span>
                <span style={{ fontWeight: "bold" }}>{formatNumber(Math.round(data.totalAmount || 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chữ ký */}
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ textAlign: "center", flex: "1" }}>
            <p style={{ margin: "0 0 50px 0", fontSize: "11px", fontWeight: "bold" }}>Người mua hàng</p>
            <p style={{ margin: "0", fontSize: "11px", fontStyle: "italic" }}>(Ký, ghi rõ họ tên)</p>
          </div>
          <div style={{ textAlign: "center", flex: "1" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "11px", fontWeight: "bold" }}>Người bán hàng</p>
            <p style={{ margin: "0 0 5px 0", fontSize: "10px" }}>Đã được ký điện tử bởi</p>
            <p style={{ margin: "0 0 5px 0", fontSize: "10px" }}>(Signed digitally by)</p>
            <p style={{ margin: "0 0 5px 0", fontSize: "11px", fontWeight: "bold" }}>CÔNG TY TNHH SENBOT VIỆT NAM</p>
            <p style={{ margin: "0", fontSize: "10px" }}>Ngày: {day}/{month}/{year}</p>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: "#666", fontStyle: "italic" }}>
          (Cần kiểm tra đối chiếu khi lập, giao, nhận hóa đơn)
        </div>
      </div>
    </>
  );
}