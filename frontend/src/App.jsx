
import { useEffect, useState } from "react";
import {
  Link2, Copy, Check, ExternalLink, QrCode, BarChart3,
  MousePointerClick, RefreshCw, Scissors, AlertCircle,
  LoaderCircle, Clock, Globe, X
} from "lucide-react";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(null);

  async function loadUrls() {
    setFetching(true);
    try {
      const response = await fetch(`${API}/api/urls`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "โหลดประวัติไม่สำเร็จ");
      }
      setUrls(result.data);
    } catch (err) {
      setError(err.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadUrls();
  }, []);

  async function handleShorten(e) {
    e.preventDefault();
    setError("");
    setShortUrl("");
    setQr(null);
    setStats(null);

    if (!originalUrl.trim()) {
      setError("กรุณากรอก URL ที่ต้องการย่อ");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: originalUrl.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "สร้างลิงก์ไม่สำเร็จ");
      }
      setShortUrl(result.data.shortUrl);
      setOriginalUrl("");
      await loadUrls();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("คัดลอกไม่ได้ กรุณาคัดลอกด้วยตนเอง");
    }
  }

  async function showQr(url) {
    setError("");
    try {
      const response = await fetch(`${API}/api/urls/${url.id}/qr`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "สร้าง QR Code ไม่สำเร็จ");
      }
      setQr({ image: result.data.qrCode, shortUrl: result.data.shortUrl });
    } catch (err) {
      setError(err.message || "โหลด QR Code ไม่สำเร็จ");
    }
  }

  async function showStats(url) {
    setError("");
    setStats(null);
    setSelectedUrl(url);
    try {
      const response = await fetch(`${API}/api/urls/${url.id}/stats`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "โหลดสถิติไม่สำเร็จ");
      }
      setStats(result.data);
    } catch (err) {
      setError(err.message || "โหลดสถิติไม่ได้");
    }
  }

  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const totalClicks = urls.reduce(
    (sum, url) => sum + Number(url.click_count || 0), 0
  );

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-2 text-xl font-extrabold">
            <span className="rounded-xl bg-slate-900 p-2 text-white">
              <Link2 size={22} />
            </span>
            <span>Link<span className="text-blue-700">Snap</span></span>
          </a>
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            URL MANAGEMENT PLATFORM
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-7 px-5 py-9 sm:py-12">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <Scissors size={16} />
            LINK MANAGEMENT WORKSPACE
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            จัดการลิงก์อย่างเป็นระบบ
            <br />
            <span className="text-blue-700">สั้นลง วัดผลได้ พร้อมใช้งาน</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-500">
            สร้างลิงก์สั้น ติดตามประสิทธิภาพการเข้าชม และจัดการ QR Code
            ได้จากพื้นที่ทำงานเดียว
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_12px_40px_-24px_rgba(15,23,42,0.22)] sm:p-7">
            <form onSubmit={handleShorten} className="space-y-4">
              <label htmlFor="url-input" className="block text-sm font-semibold">
                วาง URL ที่ต้องการย่อ
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50/60 px-4 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <Globe size={20} className="shrink-0 text-slate-400" />
                <input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/your/long/url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  required
                  className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-slate-400"
                />
                {originalUrl && (
                  <button
                    type="button"
                    onClick={() => setOriginalUrl("")}
                    aria-label="ล้าง URL"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`${buttonClass} w-full bg-slate-900 text-white hover:bg-blue-700`}
              >
                {loading ? (
                  <><LoaderCircle className="animate-spin" size={19} /> กำลังสร้างลิงก์...</>
                ) : (
                  <><Scissors size={19} /> ย่อลิงก์เลย</>
                )}
              </button>
            </form>

            {error && (
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {shortUrl && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-emerald-700">
                  <Check size={19} /> สร้าง Short URL สำเร็จ!
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-2 break-all font-semibold text-blue-700 hover:underline"
                  >
                    {shortUrl}<ExternalLink size={15} className="shrink-0" />
                  </a>
                  <button
                    type="button"
                    onClick={() => copyUrl(shortUrl)}
                    className={`${buttonClass} shrink-0 bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50`}
                  >
                    {copied ? <Check size={17} /> : <Copy size={17} />}
                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "ลิงก์ทั้งหมด", value: urls.length, icon: Link2, color: "bg-blue-50 text-blue-700" },
            { label: "จำนวนคลิกทั้งหมด", value: totalClicks.toLocaleString("th-TH"), icon: MousePointerClick, color: "bg-blue-100 text-blue-700" },
            { label: "ค่าเฉลี่ยคลิกต่อลิงก์", value: urls.length ? (totalClicks / urls.length).toFixed(1) : "0", icon: BarChart3, color: "bg-emerald-100 text-emerald-700" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
                <div className={`rounded-xl p-3 ${item.color}`}><Icon size={22} /></div>
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <strong className="text-2xl font-extrabold">{item.value}</strong>
                </div>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h2 className="text-xl font-bold">ประวัติลิงก์</h2>
              <p className="mt-1 text-sm text-slate-500">ภาพรวมลิงก์ที่สร้าง พร้อมเครื่องมือคัดลอก QR Code และสถิติ</p>
            </div>
            <button
              type="button"
              onClick={loadUrls}
              disabled={fetching}
              className={`${buttonClass} bg-slate-100 py-2.5 text-sm text-slate-700 hover:bg-slate-200`}
            >
              <RefreshCw size={16} className={fetching ? "animate-spin" : ""} />
              รีเฟรช
            </button>
          </div>

          {fetching && urls.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-slate-500">
              <LoaderCircle className="animate-spin" size={28} />
              กำลังโหลดข้อมูล...
            </div>
          ) : urls.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-400"><Link2 size={30} /></div>
              <strong>ยังไม่มีประวัติลิงก์</strong>
              <p className="text-sm text-slate-500">ลองสร้าง Short URL แรกของคุณได้เลย</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">ลิงก์ต้นฉบับ</th>
                    <th className="px-5 py-4">Short URL</th>
                    <th className="px-5 py-4">จำนวนคลิก</th>
                    <th className="px-5 py-4">วันที่สร้าง</th>
                    <th className="px-5 py-4">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {urls.map((url) => (
                    <tr key={url.id} className="hover:bg-slate-50">
                      <td className="max-w-xs truncate px-5 py-4" title={url.original_url}>
                        {url.original_url}
                      </td>
                      <td className="px-5 py-4">
                        <a href={url.shortUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
                          {url.short_code}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                          <MousePointerClick size={14} />
                          {Number(url.click_count || 0).toLocaleString("th-TH")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDate(url.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button title="คัดลอกลิงก์" onClick={() => copyUrl(url.shortUrl)} className="rounded-lg p-2 hover:bg-slate-100"><Copy size={16} /></button>
                          <button title="แสดง QR Code" onClick={() => showQr(url)} className="rounded-lg p-2 hover:bg-slate-100"><QrCode size={17} /></button>
                          <button title="ดูสถิติ" onClick={() => showStats(url)} className="rounded-lg p-2 hover:bg-slate-100"><BarChart3 size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white px-5 py-6 text-center text-sm text-slate-500">
        <span className="inline-flex items-center gap-2"><Link2 size={17} /> LinkSnap URL Shortener</span>
        <span className="mx-2">·</span>
        Link management · Analytics · QR Code
      </footer>

      {qr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setQr(null)}>
          <div role="dialog" aria-modal="true" aria-label="QR Code" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
            <button onClick={() => setQr(null)} aria-label="ปิด" className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            <div className="mx-auto mb-3 w-fit rounded-xl bg-blue-50 p-3 text-blue-700"><QrCode size={24} /></div>
            <h2 className="text-xl font-bold">QR Code ของคุณ</h2>
            <p className="mt-1 text-sm text-slate-500">สแกนเพื่อเปิด Short URL</p>
            <img className="mx-auto my-5 w-56 max-w-full" src={qr.image} alt="QR Code" />
            <p className="mb-4 break-all text-sm text-blue-700">{qr.shortUrl}</p>
            <a href={qr.image} download="link-snap-qr.png" className={`${buttonClass} w-full bg-slate-900 text-white hover:bg-blue-700`}>
              <QrCode size={18} /> ดาวน์โหลด QR Code
            </a>
          </div>
        </div>
      )}

      {stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => { setStats(null); setSelectedUrl(null); }}>
          <div role="dialog" aria-modal="true" aria-label="สถิติการคลิก" onClick={(e) => e.stopPropagation()} className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <button onClick={() => { setStats(null); setSelectedUrl(null); }} aria-label="ปิด" className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            <div className="mb-3 w-fit rounded-xl bg-blue-50 p-3 text-blue-700"><BarChart3 size={24} /></div>
            <h2 className="text-xl font-bold">สถิติการคลิก</h2>
            <p className="mt-1 break-all text-sm text-blue-700">{selectedUrl?.shortUrl}</p>
            <div className="my-5 rounded-xl bg-blue-50 p-5">
              <span className="text-sm text-slate-500">ยอดคลิกทั้งหมด</span>
              <strong className="mt-1 block text-4xl font-extrabold text-blue-700">{Number(stats.totalClicks).toLocaleString("th-TH")}</strong>
            </div>
            <h3 className="mb-3 font-bold">สถิติรายวัน</h3>
            {stats.dailyStats.length === 0 ? (
              <p className="text-sm text-slate-500">ยังไม่มีข้อมูลการคลิก</p>
            ) : (
              <div className="space-y-2">
                {stats.dailyStats.map((item) => (
                  <div key={String(item.date)} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <span className="flex items-center gap-2 text-slate-600"><Clock size={15} />{new Date(item.date).toLocaleDateString("th-TH")}</span>
                    <strong>{Number(item.clicks).toLocaleString("th-TH")} คลิก</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}