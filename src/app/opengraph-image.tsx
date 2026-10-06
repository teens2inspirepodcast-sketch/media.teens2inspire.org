import { ImageResponse } from "next/og";

export const alt = "Teens2Inspire — a little more inspiration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "66px 78px", background: "#151412", color: "#f3eee5", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 68, top: 65, width: 360, height: 360, borderRadius: 360, border: "1px solid rgba(197,169,119,.28)", display: "flex" }} />
      <div style={{ position: "absolute", right: 112, top: 109, width: 272, height: 272, borderRadius: 272, border: "1px solid rgba(229,173,173,.24)", display: "flex" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 17, fontSize: 24, letterSpacing: 1.2 }}><div style={{ width: 46, height: 46, border: "1px solid #c5a977", color: "#e5adad", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia", fontSize: 30 }}>2</div><span>Teens2Inspire</span></div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 780 }}><span style={{ color: "#c5a977", fontSize: 15, letterSpacing: 4, textTransform: "uppercase" }}>A little more inspiration</span><h1 style={{ margin: "17px 0 13px", fontSize: 78, lineHeight: 1.04, fontFamily: "Georgia", fontWeight: 400 }}>Stories, voices,<br />and room to grow.</h1><p style={{ margin: 0, color: "#bdb5aa", fontSize: 21 }}>A thoughtful space for Jewish teen girls, wherever life takes you.</p></div>
      <div style={{ width: 62, height: 2, background: "#c5a977", display: "flex" }} />
    </div>,
    size,
  );
}
