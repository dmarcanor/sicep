export default function StatCard({
    titulo,
    valor,
    subtitulo,
    tono
  }) {
    return (
      <article className={`stat-card ${tono}`}>
        <div className="stat-top">
          <span className="stat-title">{titulo}</span>
          <span className="stat-dot" />
        </div>
  
        <div className="stat-value">
          {valor}
        </div>
  
        <div className="stat-subtitle">
          {subtitulo}
        </div>
      </article>
    );
  }