import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Dashboard() {
  const [mode, setMode] = useState("office");
  const [pier, setPier] = useState("Ayak 1");

  const [productions, setProductions] = useState([]);
  const [steel, setSteel] = useState([]);
  const [progress, setProgress] = useState([]);
  const [logs, setLogs] = useState([]);

  const [productionForm, setProductionForm] = useState({
    name: "",
    quantity: "",
  });

  const [steelForm, setSteelForm] = useState({
    name: "",
    quantity: "",
    type: "giriş",
  });

  const [progressForm, setProgressForm] = useState({
    item: "",
    total_quantity: "",
    completed_quantity: "",
  });

  const [logText, setLogText] = useState("");

  const getPierIdByName = async (pierName) => {
    const { data } = await supabase
      .from("piers")
      .select("id,name")
      .eq("name", pierName)
      .single();

    return data?.id || null;
  };

  const getData = async () => {
    const { data: prod } = await supabase.from("productions").select("*");
    const { data: steelData } = await supabase.from("steel_stock").select("*");
    const { data: prog } = await supabase.from("progress").select("*");
    const { data: dailyLogs } = await supabase.from("daily_logs").select("*").order("created_at", { ascending: false });

    setProductions(prod || []);
    setSteel(steelData || []);
    setProgress(prog || []);
    setLogs(dailyLogs || []);
  };

  useEffect(() => {
    getData();
  }, []);

  const addProduction = async () => {
    if (!productionForm.name || !productionForm.quantity) return;
    const pierId = await getPierIdByName(pier);

    await supabase.from("productions").insert([
      {
        name: productionForm.name,
        quantity: Number(productionForm.quantity),
        pier_id: pierId,
      },
    ]);

    setProductionForm({ name: "", quantity: "" });
    getData();
  };

  const addSteel = async () => {
    if (!steelForm.name || !steelForm.quantity) return;

    await supabase.from("steel_stock").insert([
      {
        name: steelForm.name,
        quantity: Number(steelForm.quantity),
        type: steelForm.type,
      },
    ]);

    setSteelForm({ name: "", quantity: "", type: "giriş" });
    getData();
  };

  const addProgress = async () => {
    if (!progressForm.item || !progressForm.total_quantity || !progressForm.completed_quantity) return;
    const pierId = await getPierIdByName(pier);

    await supabase.from("progress").insert([
      {
        item: progressForm.item,
        total_quantity: Number(progressForm.total_quantity),
        completed_quantity: Number(progressForm.completed_quantity),
        pier_id: pierId,
      },
    ]);

    setProgressForm({
      item: "",
      total_quantity: "",
      completed_quantity: "",
    });
    getData();
  };

  const addDailyLog = async () => {
    if (!logText) return;
    const pierId = await getPierIdByName(pier);

    await supabase.from("daily_logs").insert([
      {
        description: logText,
        pier_id: pierId,
      },
    ]);

    setLogText("");
    getData();
  };

  const totalProduction = productions.reduce((a, b) => a + Number(b.quantity || 0), 0);

  const totalSteel = steel.reduce((a, b) => {
    return b.type === "çıkış"
      ? a - Number(b.quantity || 0)
      : a + Number(b.quantity || 0);
  }, 0);

  const totalProgress = progress.reduce((acc, item) => {
    if (!item.total_quantity) return acc;
    return acc + (Number(item.completed_quantity || 0) / Number(item.total_quantity || 1)) * 100;
  }, 0);

  const avgProgress = progress.length ? (totalProgress / progress.length).toFixed(1) : 0;

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <h1>🏗️ Şantiye Takip Sistemi</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setMode("chief")}>Şantiye Şefi Modu</button>
        <button onClick={() => setMode("office")}>Ofis Modu</button>

        <select value={pier} onChange={(e) => setPier(e.target.value)}>
          <option>Ayak 1</option>
          <option>Ayak 2</option>
          <option>Ayak 3</option>
        </select>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
        <h2>📊 Genel Durum</h2>
        <p>Toplam İmalat: {totalProduction}</p>
        <p>Toplam Demir Stok: {totalSteel}</p>
        <p>Ortalama Hakediş: %{avgProgress}</p>
        <p>Seçili Ayak: {pier}</p>
      </div>

      {mode === "chief" && (
        <>
          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>➕ İmalat Girişi</h2>
            <input
              placeholder="İmalat adı"
              value={productionForm.name}
              onChange={(e) => setProductionForm({ ...productionForm, name: e.target.value })}
            />
            <input
              placeholder="Miktar"
              type="number"
              value={productionForm.quantity}
              onChange={(e) => setProductionForm({ ...productionForm, quantity: e.target.value })}
              style={{ marginLeft: 8 }}
            />
            <button onClick={addProduction} style={{ marginLeft: 8 }}>
              Kaydet
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>📦 Demir Stok Girişi</h2>
            <input
              placeholder="Malzeme adı"
              value={steelForm.name}
              onChange={(e) => setSteelForm({ ...steelForm, name: e.target.value })}
            />
            <input
              placeholder="Miktar"
              type="number"
              value={steelForm.quantity}
              onChange={(e) => setSteelForm({ ...steelForm, quantity: e.target.value })}
              style={{ marginLeft: 8 }}
            />
            <select
              value={steelForm.type}
              onChange={(e) => setSteelForm({ ...steelForm, type: e.target.value })}
              style={{ marginLeft: 8 }}
            >
              <option value="giriş">giriş</option>
              <option value="çıkış">çıkış</option>
            </select>
            <button onClick={addSteel} style={{ marginLeft: 8 }}>
              Kaydet
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>💰 Hakediş Girişi</h2>
            <input
              placeholder="İş kalemi"
              value={progressForm.item}
              onChange={(e) => setProgressForm({ ...progressForm, item: e.target.value })}
            />
            <input
              placeholder="Toplam miktar"
              type="number"
              value={progressForm.total_quantity}
              onChange={(e) => setProgressForm({ ...progressForm, total_quantity: e.target.value })}
              style={{ marginLeft: 8 }}
            />
            <input
              placeholder="Tamamlanan miktar"
              type="number"
              value={progressForm.completed_quantity}
              onChange={(e) => setProgressForm({ ...progressForm, completed_quantity: e.target.value })}
              style={{ marginLeft: 8 }}
            />
            <button onClick={addProgress} style={{ marginLeft: 8 }}>
              Kaydet
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>📝 Günlük Rapor</h2>
            <textarea
              placeholder="Bugün yapılan işleri yaz"
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              rows={4}
              style={{ width: "100%" }}
            />
            <button onClick={addDailyLog} style={{ marginTop: 10 }}>
              Raporu Kaydet
            </button>
          </div>
        </>
      )}

      {mode === "office" && (
        <>
          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>🏗️ İmalatlar</h2>
            {productions.length === 0 ? <p>Kayıt yok</p> : productions.map((p) => (
              <div key={p.id}>{p.name} - {p.quantity}</div>
            ))}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>📦 Demir Stok Hareketleri</h2>
            {steel.length === 0 ? <p>Kayıt yok</p> : steel.map((s) => (
              <div key={s.id}>{s.name} - {s.quantity} ({s.type})</div>
            ))}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>💰 Hakediş Detayı</h2>
            {progress.length === 0 ? <p>Kayıt yok</p> : progress.map((p) => (
              <div key={p.id}>
                {p.item} - %{((Number(p.completed_quantity || 0) / Number(p.total_quantity || 1)) * 100).toFixed(1)}
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>📅 Günlük Raporlar</h2>
            {logs.length === 0 ? <p>Rapor yok</p> : logs.map((log) => (
              <div key={log.id} style={{ marginBottom: 10 }}>
                <strong>{new Date(log.created_at).toLocaleString()}</strong>
                <div>{log.description}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
