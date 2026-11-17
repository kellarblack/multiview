interface Sport {
  key: string;
  name: string;
  league: string;
  url: string;
  thumb: string;
}

export const SPORTS: Sport[] = [
  {
    key: 'basketball',
    name: 'Basketball',
    league: 'NBA',
    url: 'https://www.youtube.com/watch?v=y-jR93AytPc',
    thumb: 'y-jR93AytPc',
  },
  {
    key: 'soccer',
    name: 'Soccer',
    league: 'Premier League',
    url: 'https://www.youtube.com/watch?v=p4aNGqai4ec',
    thumb: 'p4aNGqai4ec',
  },
  {
    key: 'cfb',
    name: 'College football',
    league: 'ESPN College Football',
    url: 'https://www.youtube.com/watch?v=MRO9RbJuZLg',
    thumb: 'MRO9RbJuZLg',
  },
];

const frame = (id: string) => `https://i.ytimg.com/vi/${id}/mq2.jpg`;

interface Props {
  onOpen: (urls: string[]) => void;
}

export function Slate({ onOpen }: Props) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>the slate</h2>
        <button type="button" className="link-btn" onClick={() => onOpen(SPORTS.map((s) => s.url))}>
          all sports →
        </button>
      </div>
      <div className="slate-grid">
        {SPORTS.map((sport) => (
          <button
            key={sport.key}
            type="button"
            className="slate-card"
            onClick={() => onOpen([sport.url])}
            title={`Open ${sport.name}`}
          >
            <span className="slate-thumb">
              <img src={frame(sport.thumb)} alt="" loading="lazy" width={480} height={270} />
              <span className="slate-live">
                <i />
                live
              </span>
            </span>
            <span className="slate-body">
              <span className="slate-name">{sport.name.toLowerCase()}</span>
              <span className="slate-league">{sport.league}</span>
            </span>
          </button>
        ))}
        <button
          type="button"
          className="slate-card slate-all"
          onClick={() => onOpen(SPORTS.map((s) => s.url))}
          title="Open the sports wall"
        >
          <span className="slate-thumb">
            <span className="slate-mosaic">
              {SPORTS.map((sport) => (
                <img key={sport.key} src={frame(sport.thumb)} alt="" loading="lazy" />
              ))}
            </span>
            <span className="slate-live">
              <i />
              4 feeds
            </span>
          </span>
          <span className="slate-body">
            <span className="slate-name">all sports</span>
            <span className="slate-league">every sport</span>
          </span>
        </button>
      </div>
    </section>
  );
}
