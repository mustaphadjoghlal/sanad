export default function VoxDub() {
  return (
    <div style={{ margin: "-2rem -1rem -2rem -1rem", height: "calc(100vh - 64px)" }}>
      <iframe
        src="https://voxdub-project.vercel.app"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        allow="autoplay; clipboard-write; encrypted-media"
        allowFullScreen
        title="VoxDub — منصة التعليق الصوتي"
      />
    </div>
  );
}
