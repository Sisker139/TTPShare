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

// Cấu hình hiển thị (phải trùng với contract)
const LIKE_TARGET = 3; // số like cần để nhận thưởng
const REWARD_AMOUNT_LABEL = "1 CFLR"; // contract REWARD_AMOUNT = 1e18

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list"); // list | upload | myDocs

  // form upload
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [priceEth, setPriceEth] = useState("0");

  // tìm kiếm
  const [searchAll, setSearchAll] = useState("");
  const [searchMy, setSearchMy] = useState("");

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

        // đọc trạng thái đã claim thưởng hay chưa
        const claimed = await contract.rewardClaimed(i);

        // nếu đã đăng nhập, kiểm tra tài liệu này mình có quyền truy cập không
        let hasAccessCurrent = false;
        if (currentAccount) {
          hasAccessCurrent = await contract.userHasAccess(
            i,
            currentAccount
          );
        }

        docs.push({
          id: Number(doc.id),
          author: doc.author,
          title: doc.title,
          description: doc.description,
          fileHash: doc.fileHash,
          priceWei: doc.price,
          likeCount: Number(doc.likeCount),
          purchaseCount: Number(doc.purchaseCount),
          isActive: doc.isActive,
          rewardClaimed: claimed,
          hasAccessCurrent
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

  // Mua tài liệu (gửi CFLR)
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

  // Rút thưởng từ contract (chỉ cho tài liệu miễn phí đủ like)
  const handleClaimReward = async (docId) => {
    if (!currentAccount) return alert("Vui lòng đăng nhập trước");

    try {
      setLoading(true);
      const contract = await getContract(true);
      const tx = await contract.claimReward(docId);
      await tx.wait();
      alert("Rút thưởng thành công!");
      await loadDocuments();
    } catch (err) {
      console.error(err);
      alert(err.message || "Lỗi rút thưởng");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (wei) => {
    const big = BigInt(wei.toString());
    if (big === 0n) return "Miễn phí";
    const eth = Number(big) / 1e18;
    return eth.toFixed(4) + " CFLR";
  };

  // ==== PHÂN LOẠI & TÌM KIẾM ====

  // lọc theo tiêu đề cho trang "Thư viện tài liệu"
  const normalizedSearchAll = searchAll.trim().toLowerCase();
  const filteredAllDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(normalizedSearchAll)
  );

  // tài liệu do mình đăng
  const myUploadedDocs =
    currentAccount
      ? documents.filter(
          (doc) =>
            doc.author.toLowerCase() === currentAccount.toLowerCase()
        )
      : [];

  // tài liệu mình đã mua (có access, không phải tác giả)
  const myPurchasedDocs =
    currentAccount
      ? documents.filter(
          (doc) =>
            doc.hasAccessCurrent &&
            doc.author.toLowerCase() !== currentAccount.toLowerCase()
        )
      : [];

  // tìm kiếm trong "tài liệu của tôi"
  const normalizedSearchMy = searchMy.trim().toLowerCase();

  const filteredMyUploadedDocs = myUploadedDocs.filter((doc) =>
    doc.title.toLowerCase().includes(normalizedSearchMy)
  );

  const filteredMyPurchasedDocs = myPurchasedDocs.filter((doc) =>
    doc.title.toLowerCase().includes(normalizedSearchMy)
  );

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
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "list"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tài liệu
              </button>
              <button
                onClick={() => setActiveTab("myDocs")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "myDocs"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tài liệu của tôi
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
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
            onClick={() => setActiveTab("myDocs")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "myDocs"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/50 text-slate-600"
            }`}
          >
            Của tôi
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
                  Nếu để 0 sẽ miễn phí (có thể tham gia chương trình thưởng like)
                </p>
              </div>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Đăng tài liệu"}
              </button>

              <p className="text-xs text-slate-500 mt-3">
                Lưu ý: Tài liệu <b>miễn phí</b> đạt đủ{" "}
                <span className="font-semibold text-blue-600">
                  {LIKE_TARGET} lượt thích
                </span>{" "}
                sẽ được thưởng{" "}
                <span className="font-semibold text-emerald-600">
                  {REWARD_AMOUNT_LABEL}
                </span>{" "}
                từ quỹ thưởng (20% phí bán tài liệu có tính phí).
              </p>
            </div>
          </div>
        )}

        {/* List Tab – Thư viện tài liệu + tìm kiếm */}
        {activeTab === "list" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Thư viện tài liệu
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tìm kiếm theo tên tài liệu
                </p>
              </div>
              <div className="w-full sm:w-80">
                <input
                  type="text"
                  value={searchAll}
                  onChange={(e) => setSearchAll(e.target.value)}
                  placeholder="Nhập tên tài liệu cần tìm..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="text-sm text-slate-500 mb-4">
              {filteredAllDocs.length} kết quả
              {searchAll.trim() && ` cho từ khóa "${searchAll.trim()}"`}
            </div>

            {filteredAllDocs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  Không tìm thấy tài liệu nào
                </p>
                {!searchAll.trim() && (
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Đăng tài liệu đầu tiên →
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAllDocs.map((doc) => (
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

        {/* My Documents Tab – chia 2 mục: đã đăng & đã mua + tìm kiếm */}
        {activeTab === "myDocs" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Tài liệu của tôi
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tìm theo tên tài liệu, áp dụng cho cả tài liệu đã đăng và đã
                  mua
                </p>
              </div>
              <div className="w-full sm:w-80">
                <input
                  type="text"
                  value={searchMy}
                  onChange={(e) => setSearchMy(e.target.value)}
                  placeholder="Nhập tên tài liệu..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {!currentAccount ? (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center text-sm text-slate-600">
                Bạn cần{" "}
                <button
                  onClick={handleConnectWallet}
                  className="text-blue-600 font-semibold"
                >
                  đăng nhập ví
                </button>{" "}
                để xem các tài liệu đã đăng và đã mua.
              </div>
            ) : filteredMyUploadedDocs.length === 0 &&
              filteredMyPurchasedDocs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center">
                <FileText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  Bạn chưa có tài liệu nào khớp từ khóa.
                </p>
                {!searchMy.trim() && (
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Đăng tài liệu đầu tiên →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Tài liệu đã đăng */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Tài liệu đã đăng
                    </h3>
                    <span className="text-xs text-slate-500">
                      {filteredMyUploadedDocs.length} tài liệu
                    </span>
                  </div>

                  {filteredMyUploadedDocs.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Không có tài liệu nào khớp trong mục này.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {filteredMyUploadedDocs.map((doc) => {
                        const isFree =
                          BigInt(doc.priceWei.toString()) === 0n;
                        const progress = Math.min(
                          (doc.likeCount / LIKE_TARGET) * 100,
                          100
                        );

                        const canClaim =
                          isFree &&
                          doc.likeCount >= LIKE_TARGET &&
                          !doc.rewardClaimed;

                        return (
                          <div
                            key={doc.id}
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h4 className="text-base font-semibold text-slate-900">
                                    {doc.title}
                                  </h4>
                                  <span className="text-xs text-slate-400">
                                    ID #{doc.id}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                  {doc.description || "Không có mô tả."}
                                </p>
                                <div className="flex gap-3 text-xs text-slate-500 mb-1">
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {doc.likeCount} lượt thích
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ShoppingCart className="w-3 h-3" />
                                    {doc.purchaseCount} lượt mua
                                  </span>
                                  <span className="font-semibold">
                                    {formatPrice(doc.priceWei)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  {isFree ? (
                                    "Tài liệu miễn phí – đủ like sẽ được thưởng từ quỹ."
                                  ) : (
                                    "Tài liệu tính phí – không nằm trong chương trình thưởng."
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Thanh tiến độ & nút rút thưởng cho tài liệu miễn phí */}
                            {isFree && (
                              <>
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                    <span>Tiến độ nhận thưởng</span>
                                    <span>
                                      {doc.likeCount}/{LIKE_TARGET} lượt thích
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        progress >= 100
                                          ? "bg-gradient-to-r from-emerald-500 to-green-500"
                                          : "bg-gradient-to-r from-blue-500 to-indigo-500"
                                      }`}
                                      style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {doc.rewardClaimed
                                      ? "Bạn đã nhận thưởng cho tài liệu này."
                                      : doc.likeCount >= LIKE_TARGET
                                      ? "Đã đủ lượt thích, bạn có thể rút thưởng."
                                      : `Cần thêm ${
                                          LIKE_TARGET - doc.likeCount
                                        } lượt thích nữa để đủ điều kiện.`}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                  <div className="text-xs text-slate-500">
                                    Phần thưởng:{" "}
                                    <span className="font-semibold text-emerald-600">
                                      {REWARD_AMOUNT_LABEL}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleClaimReward(doc.id)}
                                    disabled={!canClaim || loading}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                      canClaim && !loading
                                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    }`}
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    {doc.rewardClaimed
                                      ? "Đã nhận thưởng"
                                      : "Rút thưởng"}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Tài liệu đã mua */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Tài liệu đã mua
                    </h3>
                    <span className="text-xs text-slate-500">
                      {filteredMyPurchasedDocs.length} tài liệu
                    </span>
                  </div>

                  {filteredMyPurchasedDocs.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Bạn chưa mua tài liệu nào khớp từ khóa.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {filteredMyPurchasedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="text-base font-semibold text-slate-900">
                                  {doc.title}
                                </h4>
                                <span className="text-xs text-slate-400">
                                  ID #{doc.id}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                {doc.description || "Không có mô tả."}
                              </p>
                              <div className="flex gap-3 text-xs text-slate-500 mb-2">
                                <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                                  {doc.author.slice(0, 6)}...
                                  {doc.author.slice(-4)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {doc.likeCount} lượt thích
                                </span>
                                <span className="font-semibold">
                                  {formatPrice(doc.priceWei)}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleCheckAccessAndOpen(doc)
                                }
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                Mở tài liệu
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
