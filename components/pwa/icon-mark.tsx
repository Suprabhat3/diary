export function DiaryIconMark({ size }: { size: number }) {
  const fontSize = Math.round(size * 0.42);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4efe6",
        color: "#3d342c",
        fontSize,
        fontFamily: "Georgia, serif",
      }}
    >
      D
    </div>
  );
}
