// src/App.jsx
import { useEffect, useState } from "react";
import {
  FileText,
  Heart,
  ShoppingCart,
  Eye,
  Upload,
  LogIn,
  LogOut,
  Sparkles
} from "lucide-react";

import { getContract, connectWallet } from "./blockchain";

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  // form upload
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [priceEth, setPriceEth] = useState("0");

  // load docs khi vào trang hoặc khi account thay đổi
  useEffect(() => {
    loadDocuments();
  }, [currentAccount]);

  // Kết nối ví thật (MetaMask)
  const handleConnectWallet = async () => {
    try {
      const account = await connectWallet();
      setCurrentAccount(account);
    } catch (err) {
      console.error(err);
      alert(err.message || "Không thể kết nối ví");
    }
  };

  const handleLogout = () => {
    setCurrentAccount(null);
  };

  // Lấy danh sách tài liệu từ smart contract
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const contract = await getContract(false);
      const nextId = await contract.nextDocumentId();
      const total = Number(nextId);

      const docs = [];
      for (let i = 0; i < total; i++) {
        const doc = await contract.documents(i);
        if (!doc.isActive) continue;

        docs.push({
          id: Number(doc.id),
          author: doc.author,
          title: doc.title,
          description: doc.description,
          fileHash: doc.fileHash,
          priceWei: doc.price,
          likeCount: Number(doc.likeCount),
          purchaseCount: Number(doc.purchaseCount),
          isActive: doc.isActive
        });
      }

      setDocuments(docs);
    } catch (err) {
      console.error(err);
      alert("Không tải được danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  };

  // Upload tài liệu lên smart contract
  const handleUpload = async () => {
    if (!currentAccount) return alert("Vui lòng đăng nhập trước");
    if (!title || !fileUrl) return alert("Nhập đầy đủ thông tin");

    try {
      setLoading(true);
      const contract = await getContract(true);

      const ethValue = Number(priceEth || "0");
      const wei = BigInt(Math.floor(ethValue * 1e18));

      const tx = await contract.uploadDocument(
        title,
        description,
        fileUrl,
        wei
      );
      await tx.wait();

      alert("Upload tài liệu thành công!");
      setTitle("");
      setDescription("");
      setFileUrl("");
      setPriceEth("0");
      setActiveTab("list");
      await loadDocuments();
    } catch (err) {
      console.error(err);
      alert(err.message || "Lỗi upload tài liệu");
    } finally {
      setLoading(false);
    }
  };

  // Like tài liệu trên contract
  const handleLike = async (docId) => {
    if (!currentAccount) return alert("Vui lòng đăng nhập trước");

    try {
      setLoading(true);
      const contract = await getContract(true);
      const tx = await contract.likeDocument(docId);
      await tx.wait();
      await loadDocuments();
    } catch (err) {
      console.error(err);
      alert(err.message || "Lỗi like tài liệu");
    } finally {
      setLoading(false);
    }
  };

  // Mua tài liệu (gửi ETH)
  const handleBuy = async (doc) => {
    if (!currentAccount) return alert("Vui lòng đăng nhập trước");

    try {
      setLoading(true);
      const contract = await getContract(true);
      const tx = await contract.buyDocument(doc.id, {
        value: doc.priceWei
      });
      await tx.wait();
      alert("Mua tài liệu thành công!");
      await loadDocuments();
    } catch (err) {
      console.error(err);
      alert(err.message || "Lỗi mua tài liệu");
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra đã mua chưa rồi mở file
  const handleCheckAccessAndOpen = async (doc) => {
    if (!currentAccount) return alert("Vui lòng đăng nhập trước");

    try {
      const contract = await getContract(false);
      const hasAccess = await contract.userHasAccess(doc.id, currentAccount);
      if (hasAccess) {
        window.open(doc.fileHash, "_blank");
      } else {
        alert("Bạn chưa có quyền truy cập tài liệu này. Hãy mua trước.");
      }
    } catch (err) {
      console.error(err);
      alert("Không kiểm tra được quyền truy cập");
    }
  };

  const formatPrice = (wei) => {
    const big = BigInt(wei.toString());
    if (big === 0n) return "Miễn phí";
    const eth = Number(big) / 1e18;
    return eth.toFixed(4) + " ETH";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">TTPShare</h1>
                <p className="text-xs text-slate-500">
                  Chia sẻ kiến thức & tài liệu trên blockchain
                </p>
              </div>
            </div>

            {/* Tabs (desktop) */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-full p-1">
              <button
                onClick={() => setActiveTab("list")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "list"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tài liệu
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "upload"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Đăng tải
              </button>
            </div>

            {/* Account */}
            <div className="flex items-center gap-3">
              {currentAccount && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-slate-700">
                    {currentAccount.slice(0, 6)}...
                    {currentAccount.slice(-4)}
                  </span>
                </div>
              )}

              {currentAccount ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-full font-medium text-sm transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-medium text-sm shadow-lg shadow-blue-500/30 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
            <Sparkles className="w-4 h-4 animate-spin" />
            Đang xử lý giao dịch...
          </div>
        )}

        {/* Mobile Tabs */}
        <div className="sm:hidden flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "list"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/50 text-slate-600"
            }`}
          >
            Tài liệu
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "upload"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/50 text-slate-600"
            }`}
          >
            Đăng tải
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Đăng tài liệu mới
                </h2>
                <p className="text-sm text-slate-500">
                  Chia sẻ kiến thức & tài liệu trên blockchain
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Tên tài liệu của bạn"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Mô tả chi tiết về nội dung tài liệu..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Link tài liệu *
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Giá (CFLR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={priceEth}
                  onChange={(e) => setPriceEth(e.target.value)}
                  className="w-full sm:w-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Nếu để 0 sẽ miễn phí
                </p>
              </div>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Đăng tài liệu"}
              </button>
            </div>
          </div>
        )}

        {/* List Tab */}
        {activeTab === "list" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Thư viện tài liệu
              </h2>
              <div className="text-sm text-slate-500">
                {documents.length} tài liệu
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">Chưa có tài liệu nào</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Đăng tài liệu đầu tiên →
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {doc.description || "Không có mô tả."}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                          <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                            {doc.author.slice(0, 6)}...{doc.author.slice(-4)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {doc.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            {doc.purchaseCount}
                          </span>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(doc.priceWei)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleLike(doc.id)}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                          >
                            <Heart className="w-4 h-4" />
                            Thích
                          </button>

                          {BigInt(doc.priceWei.toString()) === 0n ? (
                            <button
                              onClick={() =>
                                window.open(doc.fileHash, "_blank")
                              }
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-medium transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              Xem ngay
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleBuy(doc)}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-sm font-medium shadow-md transition-all disabled:opacity-50"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Mua ngay
                              </button>
                              <button
                                onClick={() =>
                                  handleCheckAccessAndOpen(doc)
                                }
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                Xem (nếu đã mua)
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
