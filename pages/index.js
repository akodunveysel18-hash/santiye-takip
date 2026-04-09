import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
<Chart
  options={{
    chart: { id: "imalat" },
    xaxis: {
      categories: productions.map((p) => p.name),
    },
  }}
  series={[
    {
      name: "İmalat",
      data: productions.map((p) => p.quantity),
    },
  ]}
  type="bar"
  width="100%"
/>
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Home() {
  const [mode, setMode] = useState("office");

  const [productions, setProductions] = useState([]);
  const [steel, setSteel] = useState([]);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState([]);

  const [productionName, setProductionName] = useState("");
  const [productionQty, setProductionQty] = useState("");

  const [steelName, setSteelName] = useState("");
  const [steelQty, setSteelQty] = useState("");
  const [steelType, setSteelType] = useState("giriş");

  const [logText, setLogText] = useState("");

  const [progressItem, setProgressItem] = useState("");
  const [progressTotal, setProgressTotal] = useState("");
  const [progressDone, setProgressDone] = useState("");

  async function loadData() {
    const { data: p1 } = await supabase.from("productions").select("*");
    const { data: p2 } = await supabase.from("steel_stock").select("*");
    const { data: p3 } = await supabase
      .from("daily_logs")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: p4 } = await supabase.from("progress").select("*");

    setProductions(p1 || []);
    setSteel(p2 || []);
    setLogs(p3 || []);
    setProgress(p4 || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addProduction() {
    if (!productionName || !productionQty) return;

    await supabase.from("productions").insert([
      {
        name: productionName,
        quantity: Number(productionQty),
      },
    ]);

    setProductionName("");
    setProductionQty("");
    loadData();
  }

  async function addSteel() {
    if (!steelName || !steelQty) return;

    await supabase.from("steel_stock").insert([
      {
        name: steelName,
        quantity: Number(steelQty),
        type: steelType,
      },
    ]);

    setSteelName("");
    setSteelQty("");
    setSteelType("giriş");
    loadData();
  }

  async function addLog() {
    if (!logText) return;

    await supabase.from("daily_logs").insert([
      {
        description: logText,
      },
    ]);

    setLogText("");
    loadData();
  }

  async function addProgress() {
    if (!progressItem || !progressTotal || !progressDone) return;

    await supabase.from("progress").insert([
      {
        item: progressItem,
        total_quantity: Number(progressTotal),
        completed_quantity: Number(progressDone),
      },
    ]);

    setProgressItem("");
    setProgressTotal("");
    setProgressDone("");
    loadData();
  }

  const totalProduction = productions.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const totalSteel = steel.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    return item.type === "çıkış" ? sum - qty : sum + qty;
  }, 0);

  const avgProgress =
    progress.length > 0
      ? (
          progress.reduce((sum, item) => {
            const total = Number(item.total_quantity || 0);
            const done = Number(item.completed_quantity || 0);
            if (!total) return sum;
            return sum + (done / total) * 100;
          }, 0) / progress.length
        ).toFixed(1)
      : "0";

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>Şantiye Takip Sistemi</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setMode("office")} style={{ marginRight: 8 }}>
          Ofis Modu
        </button>
        <button onClick={() => setMode("chief")}>
          Şantiye Şefi Modu
        </button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
        <h2>Genel Durum</h2>
        <p>Toplam İmalat: {totalProduction}</p>
        <p>Toplam Demir Stok: {totalSteel}</p>
        <p>Ortalama Hakediş: %{avgProgress}</p>
      </div>

      {mode === "chief" ? (
        <>
          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>İmalat Girişi</h2>
            <input
              placeholder="İmalat adı"
              value={productionName}
              onChange={(e) => setProductionName(e.target.value)}
            />
            <input
              placeholder="Miktar"
              type="number"
              value={productionQty}
              onChange={(e) => setProductionQty(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <button onClick={addProduction} style={{ marginLeft: 8 }}>
              Kaydet
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Demir Stok Girişi</h2>
            <input
              placeholder="Malzeme adı"
              value={steelName}
              onChange={(e) => setSteelName(e.target.value)}
            />
            <input
              placeholder="Miktar"
              type="number"
              value={steelQty}
              onChange={(e) => setSteelQty(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <select
              value={steelType}
              onChange={(e) => setSteelType(e.target.value)}
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
            <h2>Hakediş Girişi</h2>
            <input
              placeholder="İş kalemi"
              value={progressItem}
              onChange={(e) => setProgressItem(e.target.value)}
            />
            <input
              placeholder="Toplam miktar"
              type="number"
              value={progressTotal}
              onChange={(e) => setProgressTotal(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <input
              placeholder="Tamamlanan miktar"
              type="number"
              value={progressDone}
              onChange={(e) => setProgressDone(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <button onClick={addProgress} style={{ marginLeft: 8 }}>
              Kaydet
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Günlük Rapor</h2>
            <textarea
              rows={4}
              style={{ width: "100%" }}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="Bugün yapılan işleri yaz"
            />
            <button onClick={addLog} style={{ marginTop: 10 }}>
              Kaydet
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>İmalatlar</h2>
            {productions.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              productions.map((item) => (
                <div key={item.id}>
                  {item.name} - {item.quantity}
                </div>
              ))
            )}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Demir Stok</h2>
            {steel.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              steel.map((item) => (
                <div key={item.id}>
                  {item.name} - {item.quantity} ({item.type})
                </div>
              ))
            )}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Hakediş</h2>
            {progress.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              progress.map((item) => {
                const total = Number(item.total_quantity || 0);
                const done = Number(item.completed_quantity || 0);
                const percent = total ? ((done / total) * 100).toFixed(1) : "0";
                return (
                  <div key={item.id}>
                    {item.item} - %{percent}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Günlük Raporlar</h2>
            {logs.length === 0 ? (
              <p>Rapor yok</p>
            ) : (
              logs.map((item) => (
                <div key={item.id} style={{ marginBottom: 10 }}>
                  <strong>{item.created_at}</strong>
                  <div>{item.description}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
