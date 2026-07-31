interface UrlInputSectionProps {
  title: string;
  placeholder: string;
  buttonText: string;
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  title, placeholder, buttonText, value, onChange, onSubmit
}) => (
  <section>
    <h4 className="text-sm font-semibold text-slate-300 mb-2">{title}</h4>
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-400 font-bold text-xs rounded-xl transition"
      >
        {buttonText}
      </button>
    </form>
  </section>
);