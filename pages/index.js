import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Home() {
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);

  const todayStr = new Date().toISOString().split("T")[0];

  const [reportDate, setReportDate] = useState(todayStr);
  const [logText, setLogText] = useState("");
  const [reportImage, setReportImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
      await loadData();
    }

    init();
  }, []);

  async function loadData() {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD ERROR:", error);
      alert("Veriler yüklenemedi: " + error.message);
      return;
    }

    setLogs(data || []);
  }

  async function uploadReportImage(file) {
    if (!file) return "";

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("daily-report-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError);
      alert("Fotoğraf yükleme hatası: " + uploadError.message);
      return "";
    }

    const { data } = supabase.storage
      .from("daily-report-images")
      .getPublicUrl(fileName);

    return data?.publicUrl || "";
  }

  async function addLog() {
    if (isSaving) return;

    if (!reportDate) {
      alert("Tarih seçmelisin");
      return;
    }

    if (!logText.trim()) {
      alert("Yapılan iş alanı boş olamaz");
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = "";

      if (reportImage) {
        imageUrl = await uploadReportImage(reportImage);

        if (!imageUrl) {
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        report_date: reportDate,
        description: logText.trim(),
        image_url: imageUrl,
      };

      const { error } = await supabase.from("daily_logs").insert([payload]);

      if (error) {
        console.error("INSERT ERROR:", error);
        alert("Kayıt hatası: " + error.message);
        setIsSaving(false);
        return;
      }

      alert("Rapor kaydedildi");

      setReportDate(todayStr);
      setLogText("");
      setReportImage(null);

      await loadData();
    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  }

  if (!session) {
    return (
      <div style={{ padding: 30, fontFamily: "Arial" }}>
        <h1>Şantiye Günlük Rapor</h1>
        <p>Önce giriş yapmalısın.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 1100,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>📋 Şantiye Günlük Rapor</h1>

      <div
        style={{
          background: "#f8f8f8",
          padding: 16,
          borderRadius: 10,
          border: "1px solid #ddd",
          marginBottom: 24,
        }}
      >
        <h2>Yeni Rapor Ekle</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Tarih</label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            style={{
              padding: 10,
              width: "100%",
              maxWidth: 240,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Yapılan İş
          </label>
          <textarea
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder="Bugün yapılan işi yaz"
            style={{
              width: "100%",
              minHeight: 120,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Fotoğraf</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReportImage(e.target.files?.[0] || null)}
          />
          {reportImage ? (
            <div style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
              Seçilen dosya: {reportImage.name}
            </div>
          ) : null}
        </div>

        <button
          onClick={addLog}
          disabled={isSaving}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            background: isSaving ? "#999" : "#111827",
            color: "white",
            cursor: isSaving ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {isSaving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 10,
          border: "1px solid #ddd",
          marginBottom: 24,
        }}
      >
        <h2>📷 Fotoğraf Galerisi</h2>

        {logs.filter((item) => item.image_url).length === 0 ? (
          <p>Henüz fotoğraflı kayıt yok.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {logs
              .filter((item) => item.image_url)
              .map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#fafafa",
                  }}
                >
                  <img
                    src={item.image_url}
                    alt="Rapor görseli"
                    style={{
                      width: "100%",
                      height: 180,
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      console.log("IMAGE LOAD ERROR:", item.image_url);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      {item.report_date || "-"}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {item.description || "Açıklama yok"}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 10,
          border: "1px solid #ddd",
        }}
      >
        <h2>Son Kayıtlar</h2>

        {logs.length === 0 ? (
          <p>Kayıt yok.</p>
        ) : (
          logs.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <strong>Tarih:</strong> {item.report_date || "-"}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Açıklama:</strong> {item.description || "-"}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Fotoğraf URL:</strong>{" "}
                {item.image_url ? item.image_url : "Yok"}
              </div>

              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt="Rapor görseli"
                  style={{
                    width: "100%",
                    maxWidth: 260,
                    borderRadius: 8,
                    marginTop: 10,
                    border: "1px solid #ddd",
                  }}
                  onError={(e) => {
                    console.log("IMAGE LOAD ERROR:", item.image_url);
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div style={{ marginTop: 8, color: "#999" }}>Fotoğraf yok</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
